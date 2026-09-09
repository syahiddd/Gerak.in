<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\RoutineStatus;
use App\Http\Requests\StoreRoutineExerciseRequest;
use App\Http\Requests\StoreRoutineRequest;
use App\Http\Requests\UpdateRoutineExerciseRequest;
use App\Models\Exercise;
use App\Models\Routine;
use App\Models\RoutineExercise;
use App\Services\RoutineService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoutineController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $folders = $user->routineFolders()->with(['routines' => fn ($q) => $q->withCount('exercises')->latest()])->get();
        $ungrouped = $user->routines()->whereNull('folder_id')
            ->withCount('exercises')->latest()->get();

        return Inertia::render('Routines/Index', compact('folders', 'ungrouped'));
    }

    public function create(): Response
    {
        $exercises = Exercise::where('is_system', true)->orWhere('created_by', auth()->id())
            ->orderBy('name')->limit(200)->get();

        return Inertia::render('Routines/Create', compact('exercises'));
    }

    public function store(StoreRoutineRequest $request, RoutineService $service): RedirectResponse
    {
        $routine = $service->createRoutine(auth()->user(), $request->validated());

        return redirect()->route('routines.show', $routine)->with('success', 'Routine created.');
    }

    public function show(Routine $routine): Response
    {
        $this->authorize('view', $routine);
        $routine->load(['exercises.exercise.primaryMuscle', 'exercises.targetSets', 'folder']);

        return Inertia::render('Routines/Show', compact('routine'));
    }

    public function edit(Routine $routine): Response
    {
        $this->authorize('update', $routine);
        $routine->load(['exercises.targetSets']);
        $exercises = Exercise::where('is_system', true)->orWhere('created_by', auth()->id())
            ->orderBy('name')->limit(200)->get();
        $folders = auth()->user()->routineFolders;

        return Inertia::render('Routines/Edit', compact('routine', 'exercises', 'folders'));
    }

    public function update(StoreRoutineRequest $request, Routine $routine): RedirectResponse
    {
        $this->authorize('update', $routine);
        $data = $request->validated();

        $routine->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'notes' => $data['notes'] ?? null,
            'folder_id' => $data['folder_id'] ?? $routine->folder_id,
        ]);

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

    public function addExercise(
        StoreRoutineExerciseRequest $request,
        Routine $routine,
        RoutineService $service
    ): RedirectResponse|JsonResponse {
        $this->authorize('update', $routine);
        $re = $service->addExercise($routine, (int) $request->validated()['exercise_id'], $request->validated());

        if ($request->expectsJson()) {
            return response()->json(['exercise' => $re->load('exercise', 'targetSets')]);
        }

        return back()->with('success', 'Exercise added to routine.');
    }

    public function updateExercise(
        UpdateRoutineExerciseRequest $request,
        Routine $routine,
        RoutineExercise $exercise,
        RoutineService $service
    ): RedirectResponse|JsonResponse {
        $this->authorize('update', $routine);
        abort_unless((int) $exercise->routine_id === (int) $routine->id, 404);

        $data = $request->validated();
        $sets = $data['sets'] ?? null;
        unset($data['sets']);

        $re = $service->updateExercise($exercise, $data);
        if (is_array($sets)) {
            $re = $service->syncTargetSets($exercise, $sets);
        }

        if ($request->expectsJson()) {
            return response()->json(['exercise' => $re->load('exercise', 'targetSets')]);
        }

        return back()->with('success', 'Exercise configuration saved.');
    }

    public function removeExercise(
        Request $request,
        Routine $routine,
        RoutineExercise $exercise,
        RoutineService $service
    ): RedirectResponse|JsonResponse {
        $this->authorize('update', $routine);
        abort_unless((int) $exercise->routine_id === (int) $routine->id, 404);

        $service->removeExercise($exercise);

        if ($request->expectsJson()) {
            return response()->json(['deleted' => true]);
        }

        return back()->with('success', 'Exercise removed from routine.');
    }

    public function reorder(
        Request $request,
        Routine $routine,
        RoutineService $service
    ): RedirectResponse|JsonResponse {
        $this->authorize('update', $routine);
        $data = $request->validate([
            'order' => ['required', 'array', 'min:1'],
            'order.*' => ['integer'],
        ]);

        $service->reorderExercises($routine, array_map('intval', $data['order']));

        if ($request->expectsJson()) {
            return response()->json(['reordered' => true]);
        }

        return back()->with('success', 'Exercises reordered.');
    }
}
