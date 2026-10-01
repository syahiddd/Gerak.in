<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserSearchController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $viewer = $request->user();
        $myFollowing = $viewer->following()->pluck('users.id')->flip();

        $people = [];
        if ($q !== '') {
            $like = '%'.addcslashes(ltrim($q, '@'), '%_').'%';
            $people = User::query()
                ->where('is_suspended', false)
                ->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('username', 'like', $like))
                ->withCount('followers')
                ->orderByDesc('followers_count')
                ->limit(20)
                ->get(['id', 'name', 'username'])
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'username' => $u->username,
                    'followers_count' => $u->followers_count,
                    'is_me' => $u->id === $viewer->id,
                    'is_following' => $myFollowing->has($u->id),
                ]);
        }

        return Inertia::render('Social/People', ['q' => $q, 'people' => $people]);
    }
}
