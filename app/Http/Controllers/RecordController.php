<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\View\View;

class RecordController extends Controller
{
    public function index(): View
    {
        $records = auth()->user()->personalRecords()
            ->with(['exercise.primaryMuscle', 'workout'])
            ->latest('achieved_at')
            ->paginate(30);

        return view('records.index', compact('records'));
    }
}
