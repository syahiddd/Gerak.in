<?php

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\Routine;
use App\Models\User;
use App\Services\WorkoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RoutineBuilderTest extends TestCase
{
    use RefreshDatabase;

    private function exercise(string $name = 'Bench Press'): Exercise
    {
        return Exercise::create([
            'name' => $name,
            'slug' => Str::slug($name).'-x',
            'exercise_type' => 'weight_reps',
            'is_system' => true,
        ]);
    }

    private function routineWithExercise(User $user, Exercise $ex): Routine
    {
        $routine = $user->routines()->create(['name' => 'Push Day', 'status' => 'active']);
        $re = $routine->exercises()->create(['exercise_id' => $ex->id, 'order' => 0, 'rest_seconds' => 90]);
        $re->targetSets()->create(['order' => 0, 'target_weight_kg' => 80, 'target_reps_max' => 8, 'set_type' => 'normal']);

        return $routine;
    }

    public function test_update_meta_and_archive_toggle(): void
    {
        $user = User::factory()->create();
        $routine = $user->routines()->create(['name' => 'Old', 'status' => 'active']);
        $folder = $user->routineFolders()->create(['name' => 'PPL']);

        $this->actingAs($user)->patch(route('routines.update', $routine), [
            'name' => 'New', 'folder_id' => $folder->id,
        ])->assertRedirect();
        $this->assertEquals('New', $routine->fresh()->name);
        $this->assertEquals($folder->id, $routine->fresh()->folder_id);

        $this->actingAs($user)->post(route('routines.archive', $routine));
        $this->assertTrue($routine->fresh()->isArchived());
        $this->actingAs($user)->post(route('routines.archive', $routine));
        $this->assertFalse($routine->fresh()->isArchived());
    }

    public function test_add_exercise_creates_default_target_sets(): void
    {
        $user = User::factory()->create();
        $ex = $this->exercise();
        $routine = $user->routines()->create(['name' => 'Push Day', 'status' => 'active']);

        $this->actingAs($user)->postJson(route('routines.add-exercise', $routine), [
            'exercise_id' => $ex->id, 'rest_seconds' => 120,
        ])->assertOk()->assertJsonPath('exercise.rest_seconds', 120);

        $re = $routine->exercises()->firstOrFail();
        $this->assertEquals(0, $re->order);
        // Default set count follows user settings (factory default 3).
        $this->assertEquals(3, $re->targetSets()->count());
    }

    public function test_update_exercise_config_and_sync_target_sets(): void
    {
        $user = User::factory()->create();
        $routine = $this->routineWithExercise($user, $this->exercise());
        $re = $routine->exercises()->firstOrFail();

        $this->actingAs($user)->patchJson(route('routines.update-exercise', [$routine, $re]), [
            'rest_seconds' => 180,
            'notes' => 'Pause at chest',
            'sets' => [
                ['target_weight_kg' => 82.5, 'target_reps_min' => 6, 'target_reps_max' => 8, 'set_type' => 'normal', 'target_rpe' => 8.5],
                ['target_weight_kg' => 60, 'target_reps_min' => 10, 'target_reps_max' => 10, 'set_type' => 'warmup'],
            ],
        ])->assertOk();

        $re->refresh();
        $this->assertEquals(180, $re->rest_seconds);
        $this->assertEquals('Pause at chest', $re->notes);
        $sets = $re->targetSets()->orderBy('order')->get();
        $this->assertCount(2, $sets);
        $this->assertEquals('82.50', (string) $sets[0]->target_weight_kg);
        $this->assertEquals('warmup', $sets[1]->set_type->value);
    }

    public function test_remove_exercise_compacts_order(): void
    {
        $user = User::factory()->create();
        $routine = $user->routines()->create(['name' => 'Push Day', 'status' => 'active']);
        $a = $routine->exercises()->create(['exercise_id' => $this->exercise('A')->id, 'order' => 0]);
        $b = $routine->exercises()->create(['exercise_id' => $this->exercise('B')->id, 'order' => 1]);

        $this->actingAs($user)->deleteJson(route('routines.remove-exercise', [$routine, $a]))
            ->assertOk()->assertJsonPath('deleted', true);

        $this->assertEquals(0, (int) $b->fresh()->order);
        $this->assertEquals(1, $routine->exercises()->count());
    }

    public function test_reorder_exercises_and_reject_foreign_ids(): void
    {
        $user = User::factory()->create();
        $routine = $user->routines()->create(['name' => 'Push Day', 'status' => 'active']);
        $a = $routine->exercises()->create(['exercise_id' => $this->exercise('A')->id, 'order' => 0]);
        $b = $routine->exercises()->create(['exercise_id' => $this->exercise('B')->id, 'order' => 1]);

        $this->actingAs($user)->postJson(route('routines.reorder', $routine), [
            'order' => [$b->id, $a->id],
        ])->assertOk();

        $this->assertEquals(0, (int) $b->fresh()->order);
        $this->assertEquals(1, (int) $a->fresh()->order);

        // Foreign/mismatched ids are rejected, order untouched.
        $this->actingAs($user)->postJson(route('routines.reorder', $routine), [
            'order' => [$b->id, 999999],
        ])->assertStatus(422);
        $this->assertEquals(0, (int) $b->fresh()->order);
    }

    public function test_starting_workout_never_mutates_the_template(): void
    {
        $user = User::factory()->create();
        $routine = $this->routineWithExercise($user, $this->exercise());
        $service = app(WorkoutService::class);

        $workout = $service->startFromRoutine($user, $routine);
        $we = $workout->exercises()->firstOrFail();
        $set = $we->sets()->firstOrFail();
        $service->logSet($set, ['weight_kg' => 100, 'reps' => 5]);
        $service->completeSet($set);

        $re = $routine->exercises()->firstOrFail();
        $this->assertEquals('80.00', (string) $re->targetSets()->firstOrFail()->target_weight_kg);
        $this->assertEquals(1, $routine->exercises()->count());
    }

    public function test_cross_user_access_is_blocked_on_every_endpoint(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $routine = $this->routineWithExercise($owner, $this->exercise());
        $re = $routine->exercises()->firstOrFail();
        $ex = $this->exercise('Squat');

        $this->actingAs($other)->postJson(route('routines.add-exercise', $routine), ['exercise_id' => $ex->id])->assertForbidden();
        $this->actingAs($other)->patchJson(route('routines.update-exercise', [$routine, $re]), ['rest_seconds' => 10])->assertForbidden();
        $this->actingAs($other)->deleteJson(route('routines.remove-exercise', [$routine, $re]))->assertForbidden();
        $this->actingAs($other)->postJson(route('routines.reorder', $routine), ['order' => [$re->id]])->assertForbidden();
        $this->actingAs($other)->post(route('workouts.start-routine', $routine))->assertForbidden();

        // Mismatched routine/exercise pair is a 404 even for the owner.
        $otherRoutine = $other->routines()->create(['name' => 'Mine', 'status' => 'active']);
        $this->actingAs($owner)->patchJson(
            route('routines.update-exercise', [$otherRoutine, $re]),
            ['rest_seconds' => 10]
        )->assertStatus(403); // policy denies before pair check
    }
}
