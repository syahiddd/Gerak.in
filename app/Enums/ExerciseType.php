<?php

declare(strict_types=1);

namespace App\Enums;

enum ExerciseType: string
{
    case WeightReps = 'weight_reps';
    case BodyweightReps = 'bodyweight_reps';
    case WeightedBodyweight = 'weighted_bodyweight';
    case AssistedBodyweight = 'assisted_bodyweight';
    case Duration = 'duration';
    case DistanceDuration = 'distance_duration';

    public function isWeightBased(): bool
    {
        return in_array($this, [
            self::WeightReps,
            self::BodyweightReps,
            self::WeightedBodyweight,
            self::AssistedBodyweight,
        ], true);
    }

    public function label(): string
    {
        return match ($this) {
            self::WeightReps => 'Weight × Reps',
            self::BodyweightReps => 'Bodyweight × Reps',
            self::WeightedBodyweight => 'Weighted Bodyweight',
            self::AssistedBodyweight => 'Assisted Bodyweight',
            self::Duration => 'Duration',
            self::DistanceDuration => 'Distance + Duration',
        };
    }
}
