<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Workout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WorkoutLikeController extends Controller
{
    public function store(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorize('viewPost', $workout);
        $workout->likes()->firstOrCreate(['user_id' => $request->user()->id]);

        return back();
    }

    public function destroy(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorize('viewPost', $workout);
        $workout->likes()->where('user_id', $request->user()->id)->delete();

        return back();
    }
}
