<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\ExerciseType;
use App\Http\Requests\StoreExerciseRequest;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\WorkoutExercise;
use App\Support\OneRmCalculator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
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
            'type' => ['nullable', Rule::enum(ExerciseType::class)],
            'sort' => ['nullable', 'string', 'in:name,recent'],
        ]);

        // Cache PLAIN ARRAYS, never Eloquent models: the database cache store
        // unserializes with `allowed_classes => false` (config/cache.php),
        // so cached models come back as __PHP_Incomplete_Class and break `.map`
        // in the UI. Plain arrays round-trip cleanly (also no base64 blobs).
        $muscles = Cache::rememberForever('muscles:list:v2', fn () => Muscle::orderBy('name')->get()->toArray());
        $equipment = Cache::rememberForever('equipment:list:v2', fn () => Equipment::orderBy('name')->get()->toArray());

        $query = Exercise::query()
            ->with(['equipment', 'primaryMuscle'])
            ->where(function ($q) {
                $q->where('is_system', true)->orWhere('created_by', auth()->id());
            });

        if (! empty($validated['q'])) {
            $query->search($validated['q']);
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

        if (($validated['sort'] ?? 'name') === 'recent') {
            $query->latest('exercises.updated_at');
        } else {
            $query->orderBy('name');
        }
        $exercises = $query->paginate(24)->withQueryString();

        return Inertia::render('Exercises/Index', [
            'exercises' => $exercises,
            'muscles' => $muscles,
            'equipment' => $equipment,
            'types' => ExerciseType::cases(),
            'filters' => $validated,
        ]);
    }

    /**
     * JSON search for the exercise picker (workouts, routines). With 1,300+
     * exercises a plain <select> is unusable, so pickers query this as you type.
     * Empty query returns the user's recently used exercises.
     */
    public function lookup(Request $request): JsonResponse
    {
        $q = trim((string) ($request->validate(['q' => ['nullable', 'string', 'max:100']])['q'] ?? ''));
        $user = $request->user();
        $columns = ['id', 'name', 'slug', 'primary_muscle_id', 'image_path', 'image_url', 'image_urls', 'gif_url', 'video_url', 'media_source'];
        $base = fn () => Exercise::query()->availableTo($user)->with('primaryMuscle:id,name');

        if ($q !== '') {
            $results = $base()->search($q)
                // Names starting with the query first ("bench" → "Bench Press" before "Barbell Bench Press").
                ->orderByRaw('CASE WHEN name LIKE ? THEN 0 ELSE 1 END', [addcslashes($q, '%_').'%'])
                ->orderByRaw('LENGTH(name)')
                ->orderBy('name')
                ->limit(20)
                ->get($columns);
        } else {
            $recentIds = WorkoutExercise::query()
                ->join('workouts', 'workouts.id', '=', 'workout_exercises.workout_id')
                ->where('workouts.user_id', $user->id)
                ->latest('workout_exercises.created_at')
                ->limit(100)
                ->pluck('workout_exercises.exercise_id')
                ->unique()
                ->take(20)
                ->values();
            $results = $base()->whereIn('id', $recentIds)->get($columns)
                ->sortBy(fn (Exercise $e) => $recentIds->search($e->id))
                ->values();
            if ($results->count() < 20) {
                $results = $results->concat(
                    $base()->whereNotIn('id', $recentIds)->whereNotNull('gif_url')->orderBy('name')->limit(20 - $results->count())->get($columns)
                );
            }
        }

        return response()->json([
            'data' => $results->map(fn (Exercise $e) => [
                ...$e->only(['id', 'name', 'slug', 'image_path', 'image_url', 'image_urls', 'gif_url', 'video_url', 'media_credit']),
                'primary_muscle' => $e->primaryMuscle?->only(['id', 'name']),
            ])->values(),
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
