<?php

declare(strict_types=1);

namespace App\Support;

use App\Models\User;
use App\Models\Workout;

/**
 * Header data for a profile (name, avatar, bio, counts, follow state), shared
 * by the public profile (/u/{username}) and the signed-in user's own profile.
 */
class ProfileCard
{
    public static function for(User $user, User $viewer): array
    {
        $user->loadMissing('profile:user_id,bio,avatar_path');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'avatar_url' => $user->avatarUrl(),
            'bio' => $user->profile?->bio,
            'joined_at' => $user->created_at?->toIso8601String(),
            'workouts_count' => Workout::query()->visibleTo($viewer)->where('workouts.user_id', $user->id)->count(),
            'followers_count' => $user->followers()->count(),
            'following_count' => $user->following()->count(),
            'is_me' => $user->id === $viewer->id,
            'is_following' => $viewer->isFollowing($user),
        ];
    }
}
