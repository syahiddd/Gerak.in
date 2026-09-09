<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RoutineStatus;
use App\Models\Routine;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class RoutineService
{
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

    public function reorderExercises(Routine $routine, array $orderedIds): void
    {
        DB::transaction(function () use ($routine, $orderedIds) {
            foreach ($orderedIds as $index => $id) {
                $routine->exercises()->where('id', $id)->update(['order' => $index]);
            }
        });
    }
}
