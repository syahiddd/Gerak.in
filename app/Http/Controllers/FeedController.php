<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Workout;
use App\Services\FeedService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeedController extends Controller
{
    public function index(Request $request, FeedService $feed): Response
    {
        $tab = $request->query('tab') === 'discover' ? 'discover' : 'following';
        $viewer = $request->user();
        $cursor = $request->query('cursor');

        $posts = $tab === 'discover'
            ? $feed->discover($viewer, $cursor)
            : $feed->following($viewer, $cursor);

        return Inertia::render('Social/Feed', [
            'tab' => $tab,
            'posts' => $posts,
            'followingCount' => $viewer->following()->count(),
        ]);
    }

    public function show(Request $request, Workout $workout, FeedService $feed): Response
    {
        $this->authorize('viewPost', $workout);

        return Inertia::render('Social/Post', [
            'post' => $feed->detail($workout, $request->user()),
        ]);
    }
}
