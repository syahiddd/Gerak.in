<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Models\Workout;
use App\Services\StatisticsService;
use App\Services\WorkoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class StatisticsTest extends TestCase
{
    use RefreshDatabase;

    private function exercise(string $name, string $type = 'weight_reps'): Exercise
    {
        return Exercise::create([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'exercise_type' => $type,
            'is_system' => true,
        ]);
    }

    private function completedWorkout(User $user, string $name, \DateTimeInterface $started): Workout
    {
        return $user->workouts()->create([
            'name' => $name, 'status' => 'completed',
            'started_at' => $started, 'ended_at' => (clone $started)->modify('+1 hour'),
            'duration_seconds' => 3600, 'total_volume_kg' => 0,
            'timezone' => 'Asia/Jakarta',
        ]);
    }

    public function test_overview_counts_reps_and_ignores_incomplete_sets(): void
    {
        $user = User::factory()->create();
        $ex = $this->exercise('Bench Press');
        $w = $this->completedWorkout($user, 'Push', now()->subDay());
        $we = $w->exercises()->create(['exercise_id' => $ex->id, 'order' => 0]);
        $we->sets()->create(['order' => 0, 'set_type' => 'normal', 'weight_kg' => 80, 'reps' => 8, 'is_completed' => true]);
        $we->sets()->create(['order' => 1, 'set_type' => 'normal', 'weight_kg' => 80, 'reps' => 8, 'is_completed' => true]);
        $we->sets()->create(['order' => 2, 'set_type' => 'normal', 'weight_kg' => 100, 'reps' => 5, 'is_completed' => false]);

        $overview = app(StatisticsService::class)->overview($user);

        $this->assertEquals(1, $overview['total_workouts']);
        $this->assertEquals(2, $overview['total_sets']);
        $this->assertEquals(16, $overview['total_reps']);
    }

    public function test_duration_sets_never_contribute_weight_volume(): void
    {
        $user = User::factory()->create();
        $plank = $this->exercise('Plank', 'duration');
        $service = app(WorkoutService::class);

        $workout = $service->startEmpty($user, 'Core');
        $we = $service->addExercise($workout, $plank->id);
        $set = $we->sets()->firstOrFail();
        $service->logSet($set, ['duration_s' => 90]);
        $service->completeSet($set);
        $events = $service->finish($workout->refresh());

        $this->assertEquals(0.0, (float) $workout->fresh()->total_volume_kg);
        // Duration PR detected instead of weight PRs.
        $types = array_column($events, 'type');
        $this->assertContains('Longest duration', $types);
        $this->assertDatabaseHas('personal_records', [
            'user_id' => $user->id, 'exercise_id' => $plank->id, 'record_type' => 'best_duration',
        ]);
    }

    public function test_distance_pr_detected_for_cardio_sets(): void
    {
        $user = User::factory()->create();
        $run = $this->exercise('Treadmill Run', 'distance_duration');
        $service = app(WorkoutService::class);

        $workout = $service->startEmpty($user, 'Cardio');
        $we = $service->addExercise($workout, $run->id);
        $set = $we->sets()->firstOrFail();
        $service->logSet($set, ['distance_m' => 3000, 'duration_s' => 900]);
        $service->completeSet($set);
        $service->finish($workout->refresh());

        $this->assertDatabaseHas('personal_records', [
            'user_id' => $user->id, 'exercise_id' => $run->id, 'record_type' => 'longest_distance',
        ]);
        // Cardio contributes no weight volume.
        $this->assertEquals(0.0, (float) $workout->fresh()->total_volume_kg);
    }

    public function test_weekly_and_monthly_grouping(): void
    {
        $user = User::factory()->create();
        $w1 = $this->completedWorkout($user, 'A', now()->subDays(2));
        $w1->update(['total_volume_kg' => 1000]);
        $w2 = $this->completedWorkout($user, 'B', now()->subMonths(2)->startOfMonth()->addDay());
        $w2->update(['total_volume_kg' => 2000]);

        $stats = app(StatisticsService::class);
        $weekly = $stats->weeklyVolume($user, 12);
        $monthly = $stats->monthlyVolume($user, 12);

        // Both workouts fall inside the 12-week window.
        $this->assertEquals(3000.0, array_sum($weekly['volumes']));
        $this->assertEquals(3000.0, array_sum($monthly['volumes']));
        $this->assertCount(2, $monthly['labels']);
    }

    public function test_streak_counts_consecutive_training_days(): void
    {
        $user = User::factory()->create();
        $this->completedWorkout($user, 'A', now()->subDays(2));
        $this->completedWorkout($user, 'B', now()->subDay());
        $this->completedWorkout($user, 'C', now());

        $this->assertEquals(3, app(StatisticsService::class)->currentStreakDays($user));

        $gapUser = User::factory()->create();
        $this->completedWorkout($gapUser, 'A', now()->subDays(5));
        $this->completedWorkout($gapUser, 'B', now());

        $this->assertEquals(1, app(StatisticsService::class)->currentStreakDays($gapUser));
    }

    public function test_statistics_page_renders_with_monthly_props(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('statistics.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Statistics')
                ->has('overview.total_reps')
                ->has('monthly.labels'));
    }
}
