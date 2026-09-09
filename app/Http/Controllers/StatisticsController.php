<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\StatisticsService;
use Inertia\Inertia;
use Inertia\Response;

class StatisticsController extends Controller
{
    public function index(StatisticsService $stats): Response
    {
        $user = auth()->user();

        return Inertia::render('Statistics', [
            'overview' => $stats->overview($user),
            'weekly' => $stats->weeklyVolume($user, 12),
            'monthly' => $stats->monthlyVolume($user, 12),
            'muscles' => $stats->muscleDistribution($user, 30),
        ]);
    }
}
