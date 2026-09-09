<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class RecordController extends Controller
{
    public function index(): Response
    {
        $records = auth()->user()->personalRecords()
            ->with(['exercise.primaryMuscle', 'workout'])
            ->latest('achieved_at')
            ->paginate(30);

        return Inertia::render('Records', compact('records'));
    }
}
