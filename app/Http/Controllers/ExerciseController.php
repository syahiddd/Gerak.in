<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\ExerciseType;
use App\Http\Requests\StoreExerciseRequest;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Support\OneRmCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ExerciseController extends Controller
{
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'muscle' => ['nullable', 'integer', 'exists:muscles,id'],
            'equipment' => ['nullable', 'integer', 'exists:equipment,id'],
            'type' => ['nullable', 'string'],
            'sort' => ['nullable', 'string', 'in:name,recent'],
        ]);

        $muscles = Cache::rememberForever('muscles:list', fn () => Muscle::orderBy('name')->get());
        $equipment = Cache::rememberForever('equipment:list', fn () => Equipment::orderBy('name')->get());

        $query = Exercise::query()
            ->with(['equipment', 'primaryMuscle'])
            ->where(function ($q) {
                $q->where('is_system', true)->orWhere('created_by', auth()->id());
            });

        if (! empty($validated['q'])) {
            $query->where('name', 'like', '%'.$validated['q'].'%');
        }
        if (! empty($validated['muscle'])) {
            $query->where('primary_muscle_id', $validated['muscle']);
        }
        if (! empty($validated['equipment'])) {
            $query->where('equipment_id', $validated['equipment']);
        }
        if (! empty($validated['type'])) {
            $query->where('exercise_type', $validated['type']);
        }

        $query->orderBy('name');
        $exercises = $query->paginate(24)->withQueryString();

        return Inertia::render('Exercises/Index', [
            'exercises' => $exercises,
            'muscles' => $muscles,
            'equipment' => $equipment,
            'types' => ExerciseType::cases(),
            'filters' => $validated,
        ]);
    }

    public function show(Exercise $exercise): Response
    {
        $this->authorize('view', $exercise);
        $exercise->load(['equipment', 'primaryMuscle']);
        $user = auth()->user();

        $history = $user->workouts()->completed()
            ->join('workout_exercises', 'workout_exercises.workout_id', '=', 'workouts.id')
            ->join('workout_sets', 'workout_sets.workout_exercise_id', '=', 'workout_exercises.id')
            ->where('workout_exercises.exercise_id', $exercise->id)
            ->where('workout_sets.is_completed', true)
            ->selectRaw('workouts.started_at as date, MAX(workout_sets.weight_kg) as max_w, SUM(workout_sets.weight_kg * workout_sets.reps) as vol, SUM(workout_sets.reps) as reps')
            ->groupBy('workouts.id', 'workouts.started_at')
            ->orderBy('workouts.started_at')
            ->limit(20)
            ->get();

        $prs = $user->personalRecords()->where('exercise_id', $exercise->id)->with('workout')->get();

        $bestSet = $user->workouts()->completed()
            ->join('workout_exercises', 'workout_exercises.workout_id', '=', 'workouts.id')
            ->join('workout_sets', 'workout_sets.workout_exercise_id', '=', 'workout_exercises.id')
            ->where('workout_exercises.exercise_id', $exercise->id)
            ->where('workout_sets.is_completed', true)
            ->whereNotNull('workout_sets.weight_kg')
            ->orderByDesc('workout_sets.weight_kg')
            ->select('workout_sets.weight_kg', 'workout_sets.reps')
            ->first();

        $oneRm = $bestSet ? OneRmCalculator::epley((float) $bestSet->weight_kg, $bestSet->reps) : null;

        return Inertia::render('Exercises/Show', compact('exercise', 'history', 'prs', 'bestSet', 'oneRm'));
    }

    public function create(): Response
    {
        return Inertia::render('Exercises/Create', [
            'muscles' => Muscle::orderBy('name')->get(),
            'equipment' => Equipment::orderBy('name')->get(),
            'types' => ExerciseType::cases(),
        ]);
    }

    public function store(StoreExerciseRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $exercise = Exercise::create([
            ...$data,
            'slug' => Str::slug($data['name']).'-'.Str::lower(Str::random(6)),
            'is_system' => false,
            'created_by' => auth()->id(),
        ]);

        return redirect()->route('exercises.show', $exercise->slug)->with('success', 'Custom exercise created.');
    }

    public function edit(Exercise $exercise): Response
    {
        $this->authorize('update', $exercise);

        return Inertia::render('Exercises/Edit', [
            'exercise' => $exercise,
            'muscles' => Muscle::orderBy('name')->get(),
            'equipment' => Equipment::orderBy('name')->get(),
            'types' => ExerciseType::cases(),
        ]);
    }

    public function update(StoreExerciseRequest $request, Exercise $exercise): RedirectResponse
    {
        $this->authorize('update', $exercise);
        $exercise->update($request->validated());

        return redirect()->route('exercises.show', $exercise->slug)->with('success', 'Exercise updated.');
    }

    public function destroy(Exercise $exercise): RedirectResponse
    {
        $this->authorize('delete', $exercise);
        $exercise->delete();

        return redirect()->route('exercises.index')->with('success', 'Exercise deleted.');
    }
}
