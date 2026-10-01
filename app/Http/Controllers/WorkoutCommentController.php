<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Workout;
use App\Models\WorkoutComment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WorkoutCommentController extends Controller
{
    public function store(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorize('viewPost', $workout);
        $data = $request->validate(['body' => ['required', 'string', 'max:1000']]);

        $workout->comments()->create([
            'user_id' => $request->user()->id,
            'body' => trim($data['body']),
        ]);

        return back();
    }

    public function destroy(Request $request, WorkoutComment $comment): RedirectResponse
    {
        $userId = $request->user()->id;
        // The comment's author or the workout's owner may remove it.
        abort_unless($comment->user_id === $userId || $comment->workout->user_id === $userId, 403);
        $comment->delete();

        return back();
    }
}
