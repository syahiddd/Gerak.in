<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\SetType;
use App\Enums\WorkoutStatus;
use App\Models\Routine;
use App\Models\User;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use App\Models\WorkoutSet;
use App\Support\VolumeCalculator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class WorkoutService
{
    public function __construct(private PersonalRecordService $records) {}

    public function startEmpty(User $user, ?string $name = null): Workout
    {
        return DB::transaction(function () use ($user, $name) {
            $this->assertNoActiveWorkout($user);

            return Workout::create([
                'user_id' => $user->id,
                'name' => $name ?? 'Empty workout',
                'status' => WorkoutStatus::InProgress,
                'started_at' => now(),
                'timezone' => $user->timezone ?? 'Asia/Jakarta',
            ]);
        });
    }

    public function startFromRoutine(User $user, Routine $routine): Workout
    {
        if ((int) $routine->user_id !== (int) $user->id) {
            abort(403);
        }

        return DB::transaction(function () use ($user, $routine) {
            $this->assertNoActiveWorkout($user);
            $routine->loadMissing('exercises.targetSets');

            $workout = Workout::create([
                'user_id' => $user->id,
                'routine_id' => $routine->id,
                'name' => $routine->name,
                'status' => WorkoutStatus::InProgress,
                'started_at' => now(),
                'timezone' => $user->timezone ?? 'Asia/Jakarta',
            ]);

            foreach ($routine->exercises as $re) {
                $we = WorkoutExercise::create([
                    'workout_id' => $workout->id,
                    'exercise_id' => $re->exercise_id,
                    'order' => $re->order,
                    'notes' => $re->notes,
                    'superset_group' => $re->superset_group,
                ]);

                foreach ($re->targetSets as $ts) {
                    WorkoutSet::create([
                        'workout_exercise_id' => $we->id,
                        'order' => $ts->order,
                        'set_type' => $ts->set_type,
                        'weight_kg' => $ts->target_weight_kg,
                        'reps' => $ts->target_reps_max ?? $ts->target_reps_min,
                        'duration_s' => $ts->target_duration_s,
                        'distance_m' => $ts->target_distance_m,
                        'rpe' => null,
                        'is_completed' => false,
                    ]);
                }

                if ($re->targetSets->isEmpty()) {
                    $defaultSets = (int) ($user->settings->default_sets ?? 3);
                    for ($i = 0; $i < $defaultSets; $i++) {
                        WorkoutSet::create([
                            'workout_exercise_id' => $we->id,
                            'order' => $i,
                            'set_type' => SetType::Normal,
                            'is_completed' => false,
                        ]);
                    }
                }
            }

            return $workout->load('exercises.sets');
        });
    }

    public function addExercise(Workout $workout, int $exerciseId): WorkoutExercise
    {
        $this->assertActive($workout);

        return DB::transaction(function () use ($workout, $exerciseId) {
            $order = (int) ($workout->exercises()->max('order') ?? -1) + 1;
            $we = WorkoutExercise::create([
                'workout_id' => $workout->id,
                'exercise_id' => $exerciseId,
                'order' => $order,
            ]);
            WorkoutSet::create([
                'workout_exercise_id' => $we->id,
                'order' => 0,
                'set_type' => SetType::Normal,
                'is_completed' => false,
            ]);

            return $we->load('sets');
        });
    }

    public function logSet(WorkoutSet $set, array $data): WorkoutSet
    {
        $this->assertActive($set->workoutExercise->workout);

        return DB::transaction(function () use ($set, $data) {
            $set->fill($data);
            $set->save();

            return $set->refresh();
        });
    }

    public function completeSet(WorkoutSet $set, bool $completed = true): WorkoutSet
    {
        $this->assertActive($set->workoutExercise->workout);

        return DB::transaction(function () use ($set, $completed) {
            $set->is_completed = $completed;
            $set->completed_at = $completed ? now() : null;
            $set->save();

            return $set->refresh();
        });
    }

    /** @return array<int, array> list of new PR events */
    public function finish(Workout $workout): array
    {
        $this->assertActive($workout);

        return DB::transaction(function () use ($workout) {
            $workout->loadMissing('exercises.sets');
            // Compute before stamping ended_at so an in-progress pause is excluded.
            $workout->duration_seconds = $workout->elapsedSeconds();
            $workout->ended_at = now();
            $workout->paused_at = null;
            $workout->total_volume_kg = VolumeCalculator::workoutVolumeKg($workout);
            $workout->status = WorkoutStatus::Completed;
            $workout->save();

            return $this->records->evaluateWorkout($workout);
        });
    }

    public function pause(Workout $workout): Workout
    {
        if ($workout->status !== WorkoutStatus::InProgress) {
            throw ValidationException::withMessages([
                'workout' => 'Only an in-progress workout can be paused.',
            ]);
        }

        return DB::transaction(function () use ($workout) {
            $workout->status = WorkoutStatus::Paused;
            $workout->paused_at = now();
            $workout->save();

            return $workout->refresh();
        });
    }

    public function resume(Workout $workout): Workout
    {
        if ($workout->status !== WorkoutStatus::Paused) {
            throw ValidationException::withMessages([
                'workout' => 'Only a paused workout can be resumed.',
            ]);
        }

        return DB::transaction(function () use ($workout) {
            if ($workout->paused_at !== null) {
                $workout->paused_seconds_total += now()->getTimestamp() - $workout->paused_at->getTimestamp();
            }
            $workout->status = WorkoutStatus::InProgress;
            $workout->paused_at = null;
            $workout->save();

            return $workout->refresh();
        });
    }

    public function cancel(Workout $workout): void
    {
        $this->assertActive($workout);
        $workout->status = WorkoutStatus::Cancelled;
        $workout->ended_at = now();
        $workout->paused_at = null;
        $workout->save();
    }

    public function activeFor(User $user): ?Workout
    {
        return $user->workouts()->active()->latest('started_at')->first();
    }

    /** Throw a 422 unless the workout is in progress or paused. */
    public function ensureActive(Workout $workout): void
    {
        $this->assertActive($workout);
    }

    private function assertActive(Workout $workout): void
    {
        if (! $workout->isActive()) {
            throw ValidationException::withMessages([
                'workout' => 'Workout is no longer active.',
            ]);
        }
    }

    private function assertNoActiveWorkout(User $user): void
    {
        if ($user->workouts()->active()->exists()) {
            throw ValidationException::withMessages([
                'workout' => 'Finish or cancel the active workout first.',
            ]);
        }
    }
}
