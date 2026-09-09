<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\RecordType;
use App\Models\PersonalRecord;
use App\Models\Workout;
use App\Models\WorkoutSet;
use App\Support\OneRmCalculator;

class PersonalRecordService
{
    /**
     * Compare completed sets of a finished workout against stored PRs.
     *
     * @return array<int, array{exercise: string, type: string, detail: string}>
     */
    public function evaluateWorkout(Workout $workout): array
    {
        $workout->loadMissing('exercises.exercise', 'exercises.sets');
        $events = [];

        $byExercise = [];
        foreach ($workout->exercises as $we) {
            foreach ($we->sets as $set) {
                if (! $set->is_completed) {
                    continue;
                }
                $byExercise[$we->exercise_id][] = $set;
            }
        }

        foreach ($byExercise as $exerciseId => $sets) {
            $candidates = $this->candidates($sets);

            foreach ($candidates as $typeValue => $candidate) {
                if ($candidate === null) {
                    continue;
                }
                $type = RecordType::from($typeValue);
                $existing = PersonalRecord::where('user_id', $workout->user_id)
                    ->where('exercise_id', $exerciseId)
                    ->where('record_type', $type->value)
                    ->first();

                if ($existing === null || (float) $candidate['value'] > (float) $existing->value_primary) {
                    PersonalRecord::updateOrCreate(
                        [
                            'user_id' => $workout->user_id,
                            'exercise_id' => $exerciseId,
                            'record_type' => $type->value,
                        ],
                        [
                            'value_primary' => $candidate['value'],
                            'value_reps' => $candidate['reps'] ?? null,
                            'achieved_workout_id' => $workout->id,
                            'achieved_at' => $workout->ended_at ?? now(),
                        ]
                    );

                    $name = $workout->exercises->firstWhere('exercise_id', $exerciseId)?->exercise?->name ?? 'Exercise';
                    $events[] = ['exercise' => $name, 'type' => $type->label(), 'detail' => $candidate['detail']];
                }
            }
        }

        return $events;
    }

    /** @param iterable<WorkoutSet> $sets */
    private function candidates(iterable $sets): array
    {
        $heaviest = null;
        $bestVolume = null;
        $bestOneRm = null;
        $mostReps = null;

        foreach ($sets as $set) {
            $w = $set->weight_kg !== null ? (float) $set->weight_kg : null;
            $r = $set->reps !== null ? (int) $set->reps : null;

            if ($w !== null && $w > 0 && ($heaviest === null || $w > $heaviest['value'])) {
                $heaviest = ['value' => $w, 'reps' => $r, 'detail' => "{$w} kg".($r ? " × {$r}" : '')];
            }
            if ($w !== null && $r !== null && $w > 0 && $r > 0) {
                $vol = $w * $r;
                if ($bestVolume === null || $vol > $bestVolume['value']) {
                    $bestVolume = ['value' => $vol, 'reps' => $r, 'detail' => "{$w} kg × {$r} (vol {$vol} kg)"];
                }
            }
            $est = OneRmCalculator::epley($w, $r);
            if ($est !== null && ($bestOneRm === null || $est > $bestOneRm['value'])) {
                $bestOneRm = ['value' => $est, 'reps' => $r, 'detail' => "est. 1RM {$est} kg ({$w} × {$r})"];
            }
            if ($r !== null && ($mostReps === null || $r > $mostReps['value'])) {
                $mostReps = ['value' => $r, 'reps' => $r, 'detail' => "{$r} reps".($w ? " @ {$w} kg" : '')];
            }
        }

        return [
            RecordType::HeaviestWeight->value => $heaviest,
            RecordType::BestSetVolume->value => $bestVolume,
            RecordType::BestOneRmEst->value => $bestOneRm,
            RecordType::MostReps->value => $mostReps,
        ];
    }
}
