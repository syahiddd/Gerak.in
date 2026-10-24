<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\FeedService;
use App\Support\ProfileCard;
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
            'profile' => ProfileCard::for($user, $viewer),
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
            ->with('profile:user_id,avatar_path')
            ->orderBy('users.name')
            ->paginate(30)
            ->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'username' => $u->username,
                'avatar_url' => $u->avatarUrl(),
                'is_me' => $u->id === $viewer->id,
                'is_following' => $myFollowing->has($u->id),
            ]);

        return Inertia::render('Social/FollowList', [
            'profile' => ProfileCard::for($user, $viewer),
            'kind' => $kind,
            'people' => $people,
        ]);
    }
}
