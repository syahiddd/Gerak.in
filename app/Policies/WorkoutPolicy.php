<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;
use App\Models\Workout;

class WorkoutPolicy
{
    public function view(User $user, Workout $workout): bool
    {
        return (int) $workout->user_id === (int) $user->id;
    }

    /** Read-only social view (feed post, likes, comments). */
    public function viewPost(User $user, Workout $workout): bool
    {
        return $workout->isVisibleTo($user);
    }

    public function update(User $user, Workout $workout): bool
    {
        return (int) $workout->user_id === (int) $user->id;
    }

    public function delete(User $user, Workout $workout): bool
    {
        return (int) $workout->user_id === (int) $user->id;
    }
}
