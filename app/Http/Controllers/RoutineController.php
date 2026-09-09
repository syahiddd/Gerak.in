<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\RoutineStatus;
use App\Http\Requests\StoreRoutineRequest;
use App\Models\Exercise;
use App\Models\Routine;
use App\Services\RoutineService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class RoutineController extends Controller
{
    public function index(): View
    {
        $user = auth()->user();
        $folders = $user->routineFolders()->with(['routines' => fn ($q) => $q->withCount('exercises')->latest()])->get();
        $ungrouped = $user->routines()->whereNull('folder_id')
            ->withCount('exercises')->latest()->get();

        return view('routines.index', compact('folders', 'ungrouped'));
    }

    public function create(): View
    {
        $exercises = Exercise::where('is_system', true)->orWhere('created_by', auth()->id())
            ->orderBy('name')->limit(200)->get();

        return view('routines.create', compact('exercises'));
    }

    public function store(StoreRoutineRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $routine = DB::transaction(function () use ($data) {
            $routine = Routine::create([
                'user_id' => auth()->id(),
                'folder_id' => $data['folder_id'] ?? null,
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => RoutineStatus::Active,
            ]);

            foreach ($data['exercises'] ?? [] as $i => $ex) {
                $re = $routine->exercises()->create([
                    'exercise_id' => $ex['exercise_id'],
                    'order' => $i,
                    'notes' => $ex['notes'] ?? null,
                    'rest_seconds' => $ex['rest_seconds'] ?? 90,
                ]);
                foreach ($ex['sets'] ?? [] as $j => $set) {
                    $re->targetSets()->create([
                        'order' => $j,
                        'target_reps_min' => $set['target_reps_min'] ?? null,
                        'target_reps_max' => $set['target_reps_max'] ?? null,
                        'target_weight_kg' => $set['target_weight_kg'] ?? null,
                        'set_type' => $set['set_type'] ?? 'normal',
                    ]);
                }
                if (empty($ex['sets'])) {
                    for ($s = 0; $s < 3; $s++) {
                        $re->targetSets()->create(['order' => $s, 'set_type' => 'normal']);
                    }
                }
            }

            return $routine;
        });

        return redirect()->route('routines.show', $routine)->with('success', 'Routine created.');
    }

    public function show(Routine $routine): View
    {
        $this->authorize('view', $routine);
        $routine->load(['exercises.exercise.primaryMuscle', 'exercises.targetSets', 'folder']);

        return view('routines.show', compact('routine'));
    }

    public function edit(Routine $routine): View
    {
        $this->authorize('update', $routine);
        $routine->load(['exercises.targetSets']);
        $exercises = Exercise::where('is_system', true)->orWhere('created_by', auth()->id())
            ->orderBy('name')->limit(200)->get();
        $folders = auth()->user()->routineFolders;

        return view('routines.edit', compact('routine', 'exercises', 'folders'));
    }

    public function update(StoreRoutineRequest $request, Routine $routine): RedirectResponse
    {
        $this->authorize('update', $routine);
        $data = $request->validated();

        DB::transaction(function () use ($routine, $data) {
            $routine->update([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'notes' => $data['notes'] ?? null,
                'folder_id' => $data['folder_id'] ?? $routine->folder_id,
            ]);
        });

        return redirect()->route('routines.show', $routine)->with('success', 'Routine updated.');
    }

    public function destroy(Routine $routine): RedirectResponse
    {
        $this->authorize('delete', $routine);
        $routine->delete();

        return redirect()->route('routines.index')->with('success', 'Routine deleted.');
    }

    public function duplicate(Routine $routine, RoutineService $service): RedirectResponse
    {
        $this->authorize('view', $routine);
        $copy = $service->duplicate(auth()->user(), $routine);

        return redirect()->route('routines.show', $copy)->with('success', 'Routine duplicated.');
    }

    public function archive(Routine $routine): RedirectResponse
    {
        $this->authorize('update', $routine);
        $routine->status = $routine->isArchived() ? RoutineStatus::Active : RoutineStatus::Archived;
        $routine->save();

        return back()->with('success', 'Routine status updated.');
    }
}
