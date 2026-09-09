<?php

declare(strict_types=1);

namespace App\Support;

/** Epley formula. Weight-based exercises only; always label result as estimate. */
final class OneRmCalculator
{
    public static function epley(?float $weightKg, ?int $reps): ?float
    {
        if ($weightKg === null || $weightKg <= 0 || $reps === null || $reps < 1 || $reps > 30) {
            return null;
        }

        if ($reps === 1) {
            return round($weightKg, 2);
        }

        return round($weightKg * (1 + $reps / 30), 2);
    }
}
