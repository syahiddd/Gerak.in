<?php

declare(strict_types=1);

namespace App\Enums;

enum MeasurementType: string
{
    case Weight = 'weight';
    case BodyFat = 'body_fat';
    case Chest = 'chest';
    case Waist = 'waist';
    case Hips = 'hips';
    case ArmLeft = 'arm_l';
    case ArmRight = 'arm_r';
    case ThighLeft = 'thigh_l';
    case ThighRight = 'thigh_r';

    /** Canonical unit used in DB for this measurement. */
    public function canonicalUnit(): string
    {
        return match ($this) {
            self::Weight => 'kg',
            self::BodyFat => '%',
            default => 'cm',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::Weight => 'Body weight',
            self::BodyFat => 'Body fat',
            self::Chest => 'Chest',
            self::Waist => 'Waist',
            self::Hips => 'Hips',
            self::ArmLeft => 'Left arm',
            self::ArmRight => 'Right arm',
            self::ThighLeft => 'Left thigh',
            self::ThighRight => 'Right thigh',
        };
    }
}
