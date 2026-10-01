<?php

declare(strict_types=1);

namespace App\Enums;

enum WorkoutVisibility: string
{
    case Public = 'public';
    case Followers = 'followers';
    case Private = 'private';
}
