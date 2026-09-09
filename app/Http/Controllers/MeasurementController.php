<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreMeasurementRequest;
use App\Models\BodyMeasurement;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

class MeasurementController extends Controller
{
    public function index(): View
    {
        $measurements = auth()->user()->bodyMeasurements()
            ->latest('recorded_at')->paginate(30)->withQueryString();

        $chart = auth()->user()->bodyMeasurements()
            ->where('type', 'weight')
            ->orderBy('recorded_at')
            ->limit(60)
            ->get(['recorded_at', 'value']);

        return view('measurements.index', compact('measurements', 'chart'));
    }

    public function store(StoreMeasurementRequest $request): RedirectResponse
    {
        auth()->user()->bodyMeasurements()->create([
            ...$request->validated(),
            'recorded_at' => $request->input('recorded_at') ?? now(),
        ]);

        return back()->with('success', 'Measurement saved.');
    }

    public function destroy(BodyMeasurement $measurement): RedirectResponse
    {
        $this->authorize('delete', $measurement);
        $measurement->delete();

        return back()->with('success', 'Measurement deleted.');
    }
}
