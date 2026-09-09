<?php

declare(strict_types=1);

namespace App\Enums;

enum SetType: string
{
    case Normal = 'normal';
    case Warmup = 'warmup';
    case Drop = 'drop';
    case Failure = 'failure';
    case Assisted = 'assisted';
    case MyoRep = 'myo_rep';

    public function label(): string
    {
        return match ($this) {
            self::Normal => 'Normal',
            self::Warmup => 'Warm-up',
            self::Drop => 'Drop set',
            self::Failure => 'Failure',
            self::Assisted => 'Assisted',
            self::MyoRep => 'Myo-rep',
        };
    }

    public function shortLabel(): string
    {
        return match ($this) {
            self::Normal => 'N',
            self::Warmup => 'W',
            self::Drop => 'D',
            self::Failure => 'F',
            self::Assisted => 'A',
            self::MyoRep => 'M',
        };
    }
}
