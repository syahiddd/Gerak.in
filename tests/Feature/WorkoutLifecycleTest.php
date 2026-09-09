<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use App\Services\WorkoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class WorkoutLifecycleTest extends TestCase
{
    use RefreshDatabase;

    private function exercise(): Exercise
    {
        return Exercise::create([
            'name' => 'Bench Press',
            'slug' => 'bench-press-'.Str::lower(Str::random(4)),
            'exercise_type' => 'weight_reps',
            'is_system' => true,
        ]);
    }

    public function test_full_gym_flow_end_to_end(): void
    {
        $user = User::factory()->create();
        $ex = $this->exercise();
        $service = app(WorkoutService::class);

        // START WORKOUT
        $workout = $service->startEmpty($user, 'Push Day');
        $this->assertEquals('in_progress', $workout->status->value);

        // ADD EXERCISE + LOG SETS (weight → reps → complete)
        $we = $service->addExercise($workout, $ex->id);
        $set = $we->sets()->firstOrFail();
        $service->logSet($set, ['weight_kg' => 80, 'reps' => 8]);
        $service->completeSet($set);

        $this->assertDatabaseHas('workout_sets', [
            'id' => $set->id, 'weight_kg' => 80, 'reps' => 8, 'is_completed' => true,
        ]);

        // FINISH → summary with volume + duration + PRs
        $this->travel(45)->minutes();
        $events = $service->finish($workout->refresh());

        $workout->refresh();
        $this->assertEquals('completed', $workout->status->value);
        $this->assertEquals(640.0, (float) $workout->total_volume_kg);
        $this->assertGreaterThanOrEqual(2700, $workout->duration_seconds);
        $this->assertNotEmpty($events);
        $this->assertNull($workout->paused_at);
    }

    public function test_pause_excludes_time_from_duration(): void
    {
        $user = User::factory()->create();
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($user, 'Timed');

        $this->travel(10)->minutes();
        $service->pause($workout->refresh());
        $this->assertEquals('paused', $workout->fresh()->status->value);

        $this->travel(5)->minutes(); // paused time must not count
        $service->resume($workout->fresh());
        $this->assertEquals(300, (int) $workout->fresh()->paused_seconds_total);

        $this->travel(10)->minutes();
        $service->finish($workout->fresh());

        // 10 + 10 active minutes; 5 paused minutes excluded.
        $this->assertEquals(1200, (int) $workout->fresh()->duration_seconds);
    }

    public function test_finish_while_paused_still_excludes_pause(): void
    {
        $user = User::factory()->create();
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($user, 'Paused finish');

        $this->travel(10)->minutes();
        $service->pause($workout->refresh());
        $this->travel(5)->minutes();
        $service->finish($workout->fresh());

        $this->assertEquals(600, (int) $workout->fresh()->duration_seconds);
    }

    public function test_invalid_transitions_are_rejected(): void
    {
        $user = User::factory()->create();
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($user, 'Transitions');
        $we = $service->addExercise($workout, $this->exercise()->id);
        $set = $we->sets()->firstOrFail();

        // Resume while in progress.
        $this->actingAs($user)->post(route('workouts.resume', $workout))->assertSessionHasErrors('workout');

        // Double pause.
        $service->pause($workout->refresh());
        $this->actingAs($user)->post(route('workouts.pause', $workout->fresh()))->assertSessionHasErrors('workout');

        // Finish twice.
        $service->resume($workout->fresh());
        $service->finish($workout->fresh());
        $this->actingAs($user)->post(route('workouts.finish', $workout->fresh()))->assertSessionHasErrors('workout');

        // Mutations after finish are rejected.
        $this->actingAs($user)->patchJson(route('workouts.update-set', $set), ['reps' => 5])
            ->assertStatus(422);
    }

    public function test_refresh_does_not_lose_workout_state(): void
    {
        $user = User::factory()->create();
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($user, 'Refresh me');
        $we = $service->addExercise($workout, $this->exercise()->id);
        $set = $we->sets()->firstOrFail();
        $service->logSet($set, ['weight_kg' => 60, 'reps' => 10]);

        // Simulate a fresh browser session: new request, same user.
        $recovered = $service->activeFor($user);
        $this->assertNotNull($recovered);
        $this->assertEquals($workout->id, $recovered->id);

        $this->actingAs($user)->get(route('workouts.active'))
            ->assertRedirect(route('workouts.show', $workout));

        $this->actingAs($user)->get(route('workouts.show', $workout))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('workout.exercises.0.sets.0.weight_kg', '60.00')
                ->where('workout.exercises.0.sets.0.reps', 10));
    }

    public function test_exercise_notes_update_and_authorization(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($owner, 'Notes');
        $we = $service->addExercise($workout, $this->exercise()->id);

        $this->actingAs($owner)->patchJson(
            route('workouts.update-exercise', [$workout, $we]),
            ['notes' => 'Elbows tucked']
        )->assertOk()->assertJsonPath('exercise.notes', 'Elbows tucked');

        $this->actingAs($other)->patchJson(
            route('workouts.update-exercise', [$workout, $we]),
            ['notes' => 'Hacked']
        )->assertForbidden();

        $this->actingAs($owner)->post(route('workouts.pause', $workout))->assertRedirect();
        $this->actingAs($other)->post(route('workouts.resume', $workout))->assertForbidden();
    }
}
