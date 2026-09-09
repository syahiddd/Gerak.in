<?php

declare(strict_types=1);

namespace App\Enums;

enum RecordType: string
{
    case HeaviestWeight = 'heaviest_weight';
    case BestSetVolume = 'best_set_volume';
    case BestOneRmEst = 'best_1rm_est';
    case MostReps = 'most_reps';
    case BestDuration = 'best_duration';
    case LongestDistance = 'longest_distance';

    public function label(): string
    {
        return match ($this) {
            self::HeaviestWeight => 'Heaviest weight',
            self::BestSetVolume => 'Best set volume',
            self::BestOneRmEst => 'Best 1RM (est.)',
            self::MostReps => 'Most reps',
            self::BestDuration => 'Longest duration',
            self::LongestDistance => 'Longest distance',
        };
    }
}
