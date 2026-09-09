<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RoutineStatus;
use App\Enums\SetType;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RoutineService
{
    /**
     * Create a routine with nested exercises + target sets in one transaction.
     *
     * @param  array{exercises?: array<int, array<string, mixed>>}  $data
     */
    public function createRoutine(User $user, array $data): Routine
    {
        return DB::transaction(function () use ($user, $data) {
            $routine = Routine::create([
                'user_id' => $user->id,
                'folder_id' => $data['folder_id'] ?? null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => RoutineStatus::Active,
            ]);

            foreach ($data['exercises'] ?? [] as $i => $ex) {
                $this->attachExercise($routine, (int) $ex['exercise_id'], $i, $ex);
            }

            return $routine->load('exercises.targetSets');
        });
    }

    /**
     * Attach an exercise to a routine with default (or given) target sets.
     *
     * @param  array<string, mixed>  $attributes
     */
    public function addExercise(Routine $routine, int $exerciseId, array $attributes = []): RoutineExercise
    {
        return DB::transaction(function () use ($routine, $exerciseId, $attributes) {
            $order = (int) ($routine->exercises()->max('order') ?? -1) + 1;

            return $this->attachExercise($routine, $exerciseId, $order, $attributes);
        });
    }

    public function removeExercise(RoutineExercise $routineExercise): void
    {
        DB::transaction(function () use ($routineExercise) {
            $routineId = $routineExercise->routine_id;
            $routineExercise->delete();
            // Compact ordering so inserts stay predictable.
            RoutineExercise::where('routine_id', $routineId)
                ->orderBy('order')
                ->get()
                ->each(fn (RoutineExercise $re, int $i) => $re->update(['order' => $i]));
        });
    }

    /**
     * @param  array<int, int>  $orderedIds  routine_exercise ids in desired order
     */
    public function reorderExercises(Routine $routine, array $orderedIds): void
    {
        DB::transaction(function () use ($routine, $orderedIds) {
            $owned = $routine->exercises()->pluck('id')->all();
            sort($owned);
            $given = $orderedIds;
            sort($given);
            if ($owned !== $given) {
                throw ValidationException::withMessages([
                    'order' => 'The exercise list does not match this routine.',
                ]);
            }

            foreach ($orderedIds as $index => $id) {
                $routine->exercises()->where('id', $id)->update(['order' => $index]);
            }
        });
    }

    /**
     * Update per-exercise configuration (rest, notes, superset).
     *
     * @param  array<string, mixed>  $attributes
     */
    public function updateExercise(RoutineExercise $routineExercise, array $attributes): RoutineExercise
    {
        return DB::transaction(function () use ($routineExercise, $attributes) {
            $routineExercise->update($attributes);

            return $routineExercise->refresh();
        });
    }

    /**
     * Replace all target sets of a routine exercise.
     *
     * @param  array<int, array<string, mixed>>  $sets
     */
    public function syncTargetSets(RoutineExercise $routineExercise, array $sets): RoutineExercise
    {
        return DB::transaction(function () use ($routineExercise, $sets) {
            $routineExercise->targetSets()->delete();
            foreach (array_values($sets) as $i => $set) {
                $routineExercise->targetSets()->create([
                    'order' => $i,
                    'target_reps_min' => $set['target_reps_min'] ?? null,
                    'target_reps_max' => $set['target_reps_max'] ?? null,
                    'target_weight_kg' => $set['target_weight_kg'] ?? null,
                    'target_duration_s' => $set['target_duration_s'] ?? null,
                    'target_distance_m' => $set['target_distance_m'] ?? null,
                    'set_type' => $set['set_type'] ?? SetType::Normal->value,
                    'target_rpe' => $set['target_rpe'] ?? null,
                ]);
            }

            return $routineExercise->load('targetSets');
        });
    }

    public function duplicate(User $user, Routine $routine): Routine
    {
        if ((int) $routine->user_id !== (int) $user->id) {
            abort(403);
        }

        return DB::transaction(function () use ($user, $routine) {
            $routine->loadMissing('exercises.targetSets');

            $copy = Routine::create([
                'user_id' => $user->id,
                'folder_id' => $routine->folder_id,
                'name' => $routine->name.' (copy)',
                'description' => $routine->description,
                'notes' => $routine->notes,
                'status' => RoutineStatus::Active,
            ]);

            foreach ($routine->exercises as $re) {
                $newRe = $copy->exercises()->create([
                    'exercise_id' => $re->exercise_id,
                    'order' => $re->order,
                    'notes' => $re->notes,
                    'rest_seconds' => $re->rest_seconds,
                    'superset_group' => $re->superset_group,
                ]);

                foreach ($re->targetSets as $ts) {
                    $newRe->targetSets()->create([
                        'order' => $ts->order,
                        'target_reps_min' => $ts->target_reps_min,
                        'target_reps_max' => $ts->target_reps_max,
                        'target_weight_kg' => $ts->target_weight_kg,
                        'target_duration_s' => $ts->target_duration_s,
                        'target_distance_m' => $ts->target_distance_m,
                        'set_type' => $ts->set_type,
                        'target_rpe' => $ts->target_rpe,
                    ]);
                }
            }

            return $copy->load('exercises.targetSets');
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function attachExercise(Routine $routine, int $exerciseId, int $order, array $attributes): RoutineExercise
    {
        $re = $routine->exercises()->create([
            'exercise_id' => $exerciseId,
            'order' => $order,
            'notes' => $attributes['notes'] ?? null,
            'rest_seconds' => $attributes['rest_seconds'] ?? 90,
            'superset_group' => $attributes['superset_group'] ?? null,
        ]);

        $sets = $attributes['sets'] ?? [];
        if (empty($sets)) {
            $defaultSets = (int) ($routine->user->settings->default_sets ?? 3);
            $sets = array_fill(0, $defaultSets, ['set_type' => SetType::Normal->value]);
        }
        $this->syncTargetSets($re, array_values($sets));

        return $re->load('targetSets');
    }
}
