<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\StatisticsService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(StatisticsService $stats): Response
    {
        $user = auth()->user();
        $overview = $stats->overview($user);
        $weekly = $stats->weeklyVolume($user, 8);
        $muscles = $stats->muscleDistribution($user, 30);

        $recentWorkouts = $user->workouts()->completed()
            ->withCount(['exercises'])
            ->latest('started_at')
            ->limit(5)
            ->get();

        $activeWorkout = $user->workouts()->active()->latest('started_at')->first();

        $routines = $user->routines()->where('status', 'active')
            ->withCount('exercises')->latest()->limit(3)->get();

        $recentPrs = $user->personalRecords()->with('exercise')
            ->latest('achieved_at')->limit(5)->get();

        $hour = (int) now()->format('G');
        $greeting = $hour < 11 ? 'Good morning' : ($hour < 18 ? 'Good afternoon' : 'Good evening');

        return Inertia::render('Dashboard', compact(
            'overview', 'weekly', 'muscles', 'recentWorkouts',
            'activeWorkout', 'routines', 'recentPrs', 'greeting'
        ));
    }
}
