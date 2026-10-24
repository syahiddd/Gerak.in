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
        $training = $stats->trainingOverview(auth()->user());

        return Inertia::render('Statistics', $training);
    }
}
