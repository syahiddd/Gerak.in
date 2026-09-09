<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Exercise;
use App\Models\User;

class ExercisePolicy
{
    public function view(User $user, Exercise $exercise): bool
    {
        if ($exercise->is_system) {
            return true;
        }

        return $exercise->created_by === null || (int) $exercise->created_by === (int) $user->id;
    }

    public function update(User $user, Exercise $exercise): bool
    {
        return $exercise->isEditableBy($user);
    }

    public function delete(User $user, Exercise $exercise): bool
    {
        return $exercise->isEditableBy($user);
    }
}
