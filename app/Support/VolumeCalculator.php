<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\Workout;
use App\Models\WorkoutSet;

final class VolumeCalculator
{
    /** Sum weight_kg × reps for completed sets. Duration/distance sets contribute 0 kg. */
    public static function setVolumeKg(WorkoutSet $set): float
    {
        return $set->volumeKg();
    }

    /** @param iterable<WorkoutSet> $sets */
    public static function totalVolumeKg(iterable $sets): float
    {
        $total = 0.0;
        foreach ($sets as $set) {
            $total += self::setVolumeKg($set);
        }

        return round($total, 2);
    }

    public static function workoutVolumeKg(Workout $workout): float
    {
        $workout->loadMissing('exercises.sets');

        $total = 0.0;
        foreach ($workout->exercises as $exercise) {
            foreach ($exercise->sets as $set) {
                $total += self::setVolumeKg($set);
            }
        }

        return round($total, 2);
    }
}
