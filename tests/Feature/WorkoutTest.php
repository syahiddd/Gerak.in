<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use App\Services\WorkoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkoutTest extends TestCase
{
    use RefreshDatabase;

    private function seedExercise(): Exercise
    {
        $muscle = Muscle::create(['name' => 'Chest', 'slug' => 'chest']);

        return Exercise::create([
            'name' => 'Bench Press', 'slug' => 'bench-press',
            'exercise_type' => 'weight_reps', 'is_system' => true,
            'primary_muscle_id' => $muscle->id,
        ]);
    }

    public function test_start_workout_from_routine_copies_template(): void
    {
        $user = User::factory()->create();
        $ex = $this->seedExercise();
        $routine = $user->routines()->create(['name' => 'Push Day', 'status' => 'active']);
        $re = $routine->exercises()->create(['exercise_id' => $ex->id, 'order' => 0]);
        $re->targetSets()->create(['order' => 0, 'target_weight_kg' => 80, 'target_reps_max' => 8, 'set_type' => 'normal']);

        $response = $this->actingAs($user)->post(route('workouts.start-routine', $routine));

        $response->assertRedirect();
        $workout = $user->workouts()->first();
        $this->assertNotNull($workout);
        $this->assertEquals($routine->id, $workout->routine_id);
        $this->assertEquals(1, $workout->exercises()->count());
        // Mutating workout must not touch routine.
        $this->assertEquals(1, $routine->exercises()->count());
    }

    public function test_full_set_lifecycle_and_finish_computes_volume_and_pr(): void
    {
        $user = User::factory()->create();
        $ex = $this->seedExercise();
        $service = app(WorkoutService::class);

        $workout = $service->startEmpty($user, 'Test');
        $we = $service->addExercise($workout, $ex->id);
        $set = $we->sets()->first();

        $this->actingAs($user)->patchJson(route('workouts.update-set', $set), [
            'weight_kg' => 80, 'reps' => 8, 'is_completed' => true,
        ])->assertOk();

        $events = $service->finish($workout->refresh());

        $workout->refresh();
        $this->assertEquals('completed', $workout->status->value);
        $this->assertEquals(640.0, (float) $workout->total_volume_kg);
        $this->assertNotEmpty($events);
        $this->assertDatabaseHas('personal_records', [
            'user_id' => $user->id, 'exercise_id' => $ex->id, 'record_type' => 'heaviest_weight',
        ]);
    }

    public function test_second_active_workout_is_rejected(): void
    {
        $user = User::factory()->create();
        $service = app(WorkoutService::class);
        $service->startEmpty($user, 'First');

        $this->actingAs($user)->post(route('workouts.start-empty'))
            ->assertSessionHasErrors('workout');
    }

    public function test_active_workout_can_be_resumed(): void
    {
        $user = User::factory()->create();
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($user, 'Active');

        $this->actingAs($user)->get(route('workouts.active'))
            ->assertRedirect(route('workouts.show', $workout));
    }

    public function test_user_cannot_finish_another_users_workout(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($owner, 'Mine');

        $this->actingAs($other)->post(route('workouts.finish', $workout))->assertForbidden();
    }
}
