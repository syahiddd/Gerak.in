<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\StatisticsService;
use Illuminate\View\View;

class StatisticsController extends Controller
{
    public function index(StatisticsService $stats): View
    {
        $user = auth()->user();

        return view('statistics.index', [
            'overview' => $stats->overview($user),
            'weekly' => $stats->weeklyVolume($user, 12),
            'muscles' => $stats->muscleDistribution($user, 30),
        ]);
    }
}
