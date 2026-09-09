<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\LogSetRequest;
use App\Models\Exercise;
use App\Models\Routine;
use App\Models\Workout;
use App\Models\WorkoutExercise;
use App\Models\WorkoutSet;
use App\Services\WorkoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkoutController extends Controller
{
    public function index(Request $request): Response
    {
        $query = auth()->user()->workouts()->completed()
            ->withCount('exercises')
            ->latest('started_at');

        if ($request->filled('from')) {
            $query->where('started_at', '>=', $request->date('from')->startOfDay());
        }
        if ($request->filled('to')) {
            $query->where('started_at', '<=', $request->date('to')->endOfDay());
        }

        return Inertia::render('Workouts/Index', ['workouts' => $query->paginate(15)->withQueryString()]);
    }

    public function active(WorkoutService $service): RedirectResponse|Response
    {
        $workout = $service->activeFor(auth()->user());

        if (! $workout) {
            return redirect()->route('workouts.index')->with('info', 'No active workout. Start one first.');
        }

        return redirect()->route('workouts.show', $workout);
    }

    public function show(Workout $workout): Response
    {
        $this->authorize('view', $workout);
        $workout->load(['exercises.exercise.primaryMuscle', 'exercises.sets', 'routine']);

        // Previous performance per exercise (last completed workout before this one).
        $previous = [];
        foreach ($workout->exercises as $we) {
            $prev = WorkoutSet::join('workout_exercises as we', 'we.id', '=', 'workout_sets.workout_exercise_id')
                ->join('workouts as w', 'w.id', '=', 'we.workout_id')
                ->where('w.user_id', auth()->id())
                ->where('w.status', 'completed')
                ->where('we.exercise_id', $we->exercise_id)
                ->where('workout_sets.is_completed', true)
                ->orderByDesc('w.started_at')
                ->limit(5)
                ->get(['workout_sets.weight_kg', 'workout_sets.reps']);
            $previous[$we->id] = $prev;
        }

        $library = $workout->isActive()
            ? Exercise::where('is_system', true)->orWhere('created_by', auth()->id())->orderBy('name')->limit(100)->get()
            : collect();

        return Inertia::render('Workouts/Show', compact('workout', 'previous', 'library'));
    }

    public function startEmpty(Request $request, WorkoutService $service): RedirectResponse
    {
        $workout = $service->startEmpty(auth()->user(), $request->input('name'));

        return redirect()->route('workouts.show', $workout)->with('success', 'Workout started. Good luck!');
    }

    public function startFromRoutine(Routine $routine, WorkoutService $service): RedirectResponse
    {
        $this->authorize('view', $routine);
        $workout = $service->startFromRoutine(auth()->user(), $routine);

        return redirect()->route('workouts.show', $workout)->with('success', "Started \"{$routine->name}\".");
    }

    public function update(Request $request, Workout $workout): RedirectResponse
    {
        $this->authorize('update', $workout);
        $workout->update($request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]));

        return back()->with('success', 'Workout updated.');
    }

    public function destroy(Workout $workout): RedirectResponse
    {
        $this->authorize('delete', $workout);
        $workout->delete();

        return redirect()->route('workouts.index')->with('success', 'Workout deleted.');
    }

    public function finish(Workout $workout, WorkoutService $service): RedirectResponse
    {
        $this->authorize('update', $workout);
        $events = $service->finish($workout);

        return redirect()->route('workouts.show', $workout)->with([
            'success' => 'Workout completed. Nice work!',
            'pr_events' => $events,
        ]);
    }

    public function cancel(Workout $workout, WorkoutService $service): RedirectResponse
    {
        $this->authorize('update', $workout);
        $service->cancel($workout);

        return redirect()->route('workouts.index')->with('info', 'Workout cancelled.');
    }

    public function addExercise(Request $request, Workout $workout, WorkoutService $service): RedirectResponse|JsonResponse
    {
        $this->authorize('update', $workout);
        $data = $request->validate(['exercise_id' => ['required', 'integer', 'exists:exercises,id']]);
        $we = $service->addExercise($workout, $data['exercise_id']);

        if ($request->expectsJson()) {
            return response()->json(['exercise' => $we->load('sets', 'exercise')]);
        }

        return back()->with('success', 'Exercise added.');
    }

    public function removeExercise(Workout $workout, WorkoutExercise $exercise): RedirectResponse
    {
        $this->authorize('update', $workout);
        abort_unless((int) $exercise->workout_id === (int) $workout->id, 404);
        $exercise->delete();

        return back()->with('success', 'Exercise removed.');
    }

    public function storeSet(Request $request, Workout $workout): JsonResponse|RedirectResponse
    {
        $this->authorize('update', $workout);
        $data = $request->validate([
            'workout_exercise_id' => ['required', 'integer', 'exists:workout_exercises,id'],
            'set_type' => ['sometimes', 'string'],
        ]);
        $we = WorkoutExercise::findOrFail($data['workout_exercise_id']);
        abort_unless((int) $we->workout_id === (int) $workout->id, 404);

        $set = $we->sets()->create([
            'order' => (int) ($we->sets()->max('order') ?? -1) + 1,
            'set_type' => $data['set_type'] ?? 'normal',
            'is_completed' => false,
        ]);

        if ($request->expectsJson()) {
            return response()->json(['set' => $set]);
        }

        return back();
    }

    public function updateSet(LogSetRequest $request, WorkoutSet $set): JsonResponse|RedirectResponse
    {
        $workout = $set->workoutExercise->workout;
        $this->authorize('update', $workout);

        $set->fill($request->validated());
        if ($request->has('is_completed')) {
            $set->completed_at = $request->boolean('is_completed') ? now() : null;
        }
        $set->save();

        if ($request->expectsJson()) {
            return response()->json(['set' => $set->refresh()]);
        }

        return back();
    }

    public function destroySet(Request $request, WorkoutSet $set): JsonResponse|RedirectResponse
    {
        $this->authorize('update', $set->workoutExercise->workout);
        $set->delete();

        if ($request->expectsJson()) {
            return response()->json(['deleted' => true]);
        }

        return back();
    }
}
