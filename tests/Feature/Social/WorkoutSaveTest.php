<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\Exercise;
use App\Models\User;
use App\Services\WorkoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkoutSaveTest extends TestCase
{
    use RefreshDatabase;

    public function test_finish_goes_to_save_screen_then_post(): void
    {
        $user = User::factory()->create();
        $user->settings()->update(['default_workout_visibility' => 'followers']);
        $service = app(WorkoutService::class);
        $workout = $service->startEmpty($user, 'Push Day');
        $ex = Exercise::create(['name' => 'Bench', 'slug' => 'bench-save', 'exercise_type' => 'weight_reps', 'is_system' => true]);
        $set = $service->addExercise($workout, $ex->id)->sets()->firstOrFail();
        $service->logSet($set, ['weight_kg' => 60, 'reps' => 5]);
        $service->completeSet($set);

        $this->actingAs($user)->post(route('workouts.finish', $workout))
            ->assertRedirect(route('workouts.save', $workout))
            ->assertSessionHas('celebrate.workout_number', 1)
            ->assertSessionHas('celebrate.pr_events');
        $this->assertSame('followers', $workout->fresh()->visibility->value);

        $this->actingAs($user)->get(route('workouts.save', $workout))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Workouts/Save')->where('workout.visibility', 'followers'));

        $this->actingAs($user)->patch(route('workouts.update', $workout), [
            'name' => 'Big bench day',
            'description' => 'Felt strong.',
            'visibility' => 'public',
            'from_save' => true,
        ])->assertRedirect(route('posts.show', $workout));

        $fresh = $workout->fresh();
        $this->assertSame('public', $fresh->visibility->value);
        $this->assertSame('Felt strong.', $fresh->description);
    }

    public function test_save_screen_redirects_while_workout_is_active(): void
    {
        $user = User::factory()->create();
        $workout = app(WorkoutService::class)->startEmpty($user, 'Active');

        $this->actingAs($user)->get(route('workouts.save', $workout))->assertRedirect(route('workouts.show', $workout));
    }

    public function test_visibility_must_be_valid(): void
    {
        $user = User::factory()->create();
        $workout = app(WorkoutService::class)->startEmpty($user, 'Active');

        $this->actingAs($user)->patch(route('workouts.update', $workout), ['visibility' => 'friends'])
            ->assertSessionHasErrors('visibility');
    }
}
