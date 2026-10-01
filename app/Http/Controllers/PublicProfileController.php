<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Workout;
use App\Services\FeedService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicProfileController extends Controller
{
    public function show(Request $request, User $user, FeedService $feed): Response
    {
        abort_if($user->is_suspended, 404);
        $viewer = $request->user();

        return Inertia::render('Social/Profile', [
            'profile' => $this->header($user, $viewer),
            'posts' => $feed->byAuthor($user, $viewer, $request->query('cursor')),
        ]);
    }

    public function followers(Request $request, User $user): Response
    {
        return $this->list($request, $user, 'followers');
    }

    public function following(Request $request, User $user): Response
    {
        return $this->list($request, $user, 'following');
    }

    private function list(Request $request, User $user, string $kind): Response
    {
        abort_if($user->is_suspended, 404);
        $viewer = $request->user();
        $myFollowing = $viewer->following()->pluck('users.id')->flip();

        $people = $user->{$kind}()
            ->where('is_suspended', false)
            ->select(['users.id', 'users.name', 'users.username'])
            ->orderBy('users.name')
            ->paginate(30)
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'is_me' => $u->id === $viewer->id,
                'is_following' => $myFollowing->has($u->id),
            ]);

        return Inertia::render('Social/FollowList', [
            'profile' => $this->header($user, $viewer),
            'kind' => $kind,
            'people' => $people,
        ]);
    }

    private function header(User $user, User $viewer): array
    {
        $user->loadMissing('profile:user_id,bio');

        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
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
