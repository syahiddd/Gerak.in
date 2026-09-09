<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    public function overview(User $user): array
    {
        $completed = $user->workouts()->completed();

        $setAgg = DB::table('workout_sets')
            ->join('workout_exercises', 'workout_exercises.id', '=', 'workout_sets.workout_exercise_id')
            ->join('workouts', 'workouts.id', '=', 'workout_exercises.workout_id')
            ->where('workouts.user_id', $user->id)
            ->where('workouts.status', 'completed')
            ->where('workout_sets.is_completed', true)
            ->selectRaw('COUNT(*) as sets, COALESCE(SUM(workout_sets.reps), 0) as reps')
            ->first();

        return [
            'total_workouts' => (clone $completed)->count(),
            'total_volume_kg' => round((float) ((clone $completed)->sum('total_volume_kg') ?? 0), 2),
            'total_sets' => (int) ($setAgg->sets ?? 0),
            'total_reps' => (int) ($setAgg->reps ?? 0),
            'current_streak_days' => $this->currentStreakDays($user),
            'pr_count' => $user->personalRecords()->count(),
        ];
    }

    public function weeklyVolume(User $user, int $weeks = 12): array
    {
        // MySQL is canonical; keep the query runnable on sqlite (tests/local).
        $weekExpr = DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%W', started_at)"
            : "DATE_FORMAT(started_at, '%x-%v')";

        $rows = $user->workouts()->completed()
            ->where('started_at', '>=', now()->subWeeks($weeks)->startOfDay())
            ->selectRaw("{$weekExpr} as wk, SUM(total_volume_kg) as vol, COUNT(*) as n")
            ->groupBy('wk')
            ->orderBy('wk')
            ->get();

        return [
            'labels' => $rows->pluck('wk')->all(),
            'volumes' => $rows->pluck('vol')->map(fn ($v) => round((float) $v, 2))->all(),
            'counts' => $rows->pluck('n')->map(fn ($v) => (int) $v)->all(),
        ];
    }

    public function monthlyVolume(User $user, int $months = 12): array
    {
        // MySQL is canonical; keep the query runnable on sqlite (tests/local).
        $monthExpr = DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', started_at)"
            : "DATE_FORMAT(started_at, '%Y-%m')";

        $rows = $user->workouts()->completed()
            ->where('started_at', '>=', now()->subMonths($months)->startOfMonth())
            ->selectRaw("{$monthExpr} as mo, SUM(total_volume_kg) as vol, COUNT(*) as n")
            ->groupBy('mo')
            ->orderBy('mo')
            ->get();

        return [
            'labels' => $rows->pluck('mo')->all(),
            'volumes' => $rows->pluck('vol')->map(fn ($v) => round((float) $v, 2))->all(),
            'counts' => $rows->pluck('n')->map(fn ($v) => (int) $v)->all(),
        ];
    }

    public function muscleDistribution(User $user, int $days = 30): array
    {
        $rows = DB::table('workout_sets')
            ->join('workout_exercises', 'workout_exercises.id', '=', 'workout_sets.workout_exercise_id')
            ->join('workouts', 'workouts.id', '=', 'workout_exercises.workout_id')
            ->join('exercises', 'exercises.id', '=', 'workout_exercises.exercise_id')
            ->leftJoin('muscles', 'muscles.id', '=', 'exercises.primary_muscle_id')
            ->where('workouts.user_id', $user->id)
            ->where('workouts.status', 'completed')
            ->where('workout_sets.is_completed', true)
            ->where('workouts.started_at', '>=', now()->subDays($days)->startOfDay())
            ->selectRaw("COALESCE(muscles.name, 'Other') as muscle, COUNT(*) as sets")
            ->groupBy('muscle')
            ->orderByDesc('sets')
            ->get();

        return [
            'labels' => $rows->pluck('muscle')->all(),
            'sets' => $rows->pluck('sets')->map(fn ($v) => (int) $v)->all(),
        ];
    }

    public function currentStreakDays(User $user): int
    {
        $dates = $user->workouts()->completed()
            ->selectRaw('DATE(started_at) as d')
            ->distinct()
            ->orderByDesc('d')
            ->limit(400)
            ->pluck('d')
            ->map(fn ($d) => (string) $d)
            ->all();

        if ($dates === []) {
            return 0;
        }

        $streak = 0;
        $cursor = today();
        if (! in_array($cursor->toDateString(), $dates, true)) {
            $cursor = $cursor->subDay();
        }
        foreach (range(0, 400) as $i) {
            if (in_array($cursor->toDateString(), $dates, true)) {
                $streak++;
                $cursor = $cursor->subDay();
            } else {
                break;
            }
        }

        return $streak;
    }
}
