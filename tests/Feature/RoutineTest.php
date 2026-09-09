<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoutineTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_routine_with_exercises(): void
    {
        $user = User::factory()->create();
        $muscle = Muscle::create(['name' => 'Chest', 'slug' => 'chest']);
        $ex = Exercise::create([
            'name' => 'Bench Press', 'slug' => 'bench-press',
            'exercise_type' => 'weight_reps', 'is_system' => true,
            'primary_muscle_id' => $muscle->id,
        ]);

        $response = $this->actingAs($user)->post(route('routines.store'), [
            'name' => 'Push Day',
            'exercises' => [
                ['exercise_id' => $ex->id, 'rest_seconds' => 120],
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('routines', ['user_id' => $user->id, 'name' => 'Push Day']);
        $this->assertDatabaseCount('routine_exercises', 1);
        // Default target sets created.
        $this->assertDatabaseCount('routine_exercise_sets', 3);
    }

    public function test_user_can_duplicate_routine(): void
    {
        $user = User::factory()->create();
        $muscle = Muscle::create(['name' => 'Chest', 'slug' => 'chest']);
        $ex = Exercise::create([
            'name' => 'Bench Press', 'slug' => 'bench-press',
            'exercise_type' => 'weight_reps', 'is_system' => true,
            'primary_muscle_id' => $muscle->id,
        ]);
        $routine = $user->routines()->create(['name' => 'Push Day', 'status' => 'active']);
        $re = $routine->exercises()->create(['exercise_id' => $ex->id, 'order' => 0]);
        $re->targetSets()->create(['order' => 0, 'target_weight_kg' => 80, 'target_reps_max' => 8, 'set_type' => 'normal']);

        $response = $this->actingAs($user)->post(route('routines.duplicate', $routine));

        $response->assertRedirect();
        $this->assertDatabaseHas('routines', ['user_id' => $user->id, 'name' => 'Push Day (copy)']);
        $this->assertDatabaseCount('routine_exercises', 2);
    }

    public function test_user_cannot_view_another_users_routine(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $routine = $owner->routines()->create(['name' => 'Secret', 'status' => 'active']);

        $this->actingAs($other)->get(route('routines.show', $routine))->assertForbidden();
    }
}
