<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Services\StatisticsService;
use App\Services\WorkoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class TrainingOverviewCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_cached_overview_is_busted_on_finish(): void
    {
        $user = User::factory()->create();
        $stats = app(StatisticsService::class);
        $service = app(WorkoutService::class);

        $this->assertEquals(0, $stats->trainingOverview($user)['overview']['total_workouts']);

        $ex = Exercise::create([
            'name' => 'Bench Press',
            'slug' => 'bench-press-'.Str::lower(Str::random(4)),
            'exercise_type' => 'weight_reps',
            'is_system' => true,
        ]);
        $workout = $service->startEmpty($user, 'Cached');
        $we = $service->addExercise($workout, $ex->id);
        $set = $we->sets()->firstOrFail();
        $service->logSet($set, ['weight_kg' => 80, 'reps' => 8]);
        $service->completeSet($set);
        $service->finish($workout->refresh());

        // Without the bust this would still read 0 from cache.
        $this->assertEquals(1, $stats->trainingOverview($user)['overview']['total_workouts']);
        $this->assertEquals(640.0, (float) $stats->trainingOverview($user)['overview']['total_volume_kg']);
    }

    public function test_cached_overview_is_busted_on_routine_create(): void
    {
        $user = User::factory()->create();
        $stats = app(StatisticsService::class);

        $stats->trainingOverview($user);

        $this->actingAs($user)->post(route('routines.store'), ['name' => 'Fresh']);

        // Cache key must be gone so the next read rebuilds.
        $this->assertNull(cache()->get('training-overview:'.$user->id));
    }
}
