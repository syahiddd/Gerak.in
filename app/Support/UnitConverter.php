<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Canonical storage: kg / cm. Convert only at presentation boundaries.
 */
final class UnitConverter
{
    public const KG_PER_LB = 0.45359237;

    public const CM_PER_IN = 2.54;

    public static function kgToLb(float $kg): float
    {
        return $kg / self::KG_PER_LB;
    }

    public static function lbToKg(float $lb): float
    {
        return $lb * self::KG_PER_LB;
    }

    public static function cmToIn(float $cm): float
    {
        return $cm / self::CM_PER_IN;
    }

    public static function inToCm(float $in): float
    {
        return $in * self::CM_PER_IN;
    }

    public static function displayWeight(float $kg, string $system): array
    {
        if ($system === 'imperial') {
            return ['value' => round(self::kgToLb($kg), 1), 'unit' => 'lb'];
        }

        return ['value' => round($kg, 1), 'unit' => 'kg'];
    }

    public static function displayLength(float $cm, string $system): array
    {
        if ($system === 'imperial') {
            return ['value' => round(self::cmToIn($cm), 1), 'unit' => 'in'];
        }

        return ['value' => round($cm, 1), 'unit' => 'cm'];
    }
}
