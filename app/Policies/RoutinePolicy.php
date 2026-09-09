<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Routine;
use App\Models\User;

class RoutinePolicy
{
    public function view(User $user, Routine $routine): bool
    {
        return (int) $routine->user_id === (int) $user->id;
    }

    public function update(User $user, Routine $routine): bool
    {
        return (int) $routine->user_id === (int) $user->id;
    }

    public function delete(User $user, Routine $routine): bool
    {
        return (int) $routine->user_id === (int) $user->id;
    }
}
