<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    private const TRAINING_TTL = 60;

    /**
     * Cached training snapshot for profile/dashboard/statistics pages.
     * Busted on workout start/finish/cancel and routine changes (see forgetTrainingOverview).
     *
     * @return array{overview: array, weekly: array, monthly: array, muscles: array}
     */
    public function trainingOverview(User $user): array
    {
        return Cache::remember(
            "training-overview:{$user->id}",
            self::TRAINING_TTL,
            fn () => [
                'overview' => $this->overview($user),
                'weekly' => $this->weeklyVolume($user, 12),
                'monthly' => $this->monthlyVolume($user, 12),
                'muscles' => $this->muscleDistribution($user, 30),
            ]
        );
    }

    public function forgetTrainingOverview(User|int $user): void
    {
        Cache::forget('training-overview:'.($user instanceof User ? $user->id : $user));
    }

    public function overview(User $user): array
    {
        $workoutAgg = $user->workouts()->completed()
            ->selectRaw('COUNT(*) as n, COALESCE(SUM(total_volume_kg), 0) as vol')
            ->first();

        $setAgg = DB::table('workout_sets')
            ->join('workout_exercises', 'workout_exercises.id', '=', 'workout_sets.workout_exercise_id')
            ->join('workouts', 'workouts.id', '=', 'workout_exercises.workout_id')
            ->where('workouts.user_id', $user->id)
            ->where('workouts.status', 'completed')
            ->where('workout_sets.is_completed', true)
            ->selectRaw('COUNT(*) as sets, COALESCE(SUM(workout_sets.reps), 0) as reps')
            ->first();

        return [
            'total_workouts' => (int) ($workoutAgg->n ?? 0),
            'total_volume_kg' => round((float) ($workoutAgg->vol ?? 0), 2),
            'total_sets' => (int) ($setAgg->sets ?? 0),
            'total_reps' => (int) ($setAgg->reps ?? 0),
            'current_streak_days' => $this->currentStreakDays($user),
            'pr_count' => $user->personalRecords()->count(),
        ];
    }

    public function weeklyVolume(User $user, int $weeks = 12): array
    {
        $weekExpr = $this->weekExpression();

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
        $monthExpr = $this->monthExpression();

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

    /**
     * ISO week-year label (e.g. "2026-36"), portable across mysql/pgsql/sqlite.
     */
    private function weekExpression(): string
    {
        return match (DB::getDriverName()) {
            'pgsql' => "TO_CHAR(started_at, 'IYYY-IW')",
            'sqlite' => "strftime('%Y-%W', started_at)",
            default => "DATE_FORMAT(started_at, '%x-%v')",
        };
    }

    /**
     * Month label (e.g. "2026-09"), portable across mysql/pgsql/sqlite.
     */
    private function monthExpression(): string
    {
        return match (DB::getDriverName()) {
            'pgsql' => "TO_CHAR(started_at, 'YYYY-MM')",
            'sqlite' => "strftime('%Y-%m', started_at)",
            default => "DATE_FORMAT(started_at, '%Y-%m')",
        };
    }
}
