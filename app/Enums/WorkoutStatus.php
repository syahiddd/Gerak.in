<?php

declare(strict_types=1);

namespace App\Enums;

enum WorkoutStatus: string
{
    case InProgress = 'in_progress';
    case Paused = 'paused';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
