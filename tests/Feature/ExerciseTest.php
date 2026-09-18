<?php

namespace Tests\Feature;

use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ExerciseTest extends TestCase
{
    use RefreshDatabase;

    private function seedTaxonomy(): array
    {
        $chest = Muscle::create(['name' => 'Chest', 'slug' => 'chest', 'group' => 'push']);
        $back = Muscle::create(['name' => 'Back', 'slug' => 'back', 'group' => 'pull']);

        return [$chest, $back];
    }

    private function systemExercise(string $name = 'Bench Press', ?int $muscleId = null): Exercise
    {
        return Exercise::create([
            'name' => $name,
            'slug' => Str::slug($name),
            'exercise_type' => 'weight_reps',
            'is_system' => true,
            'primary_muscle_id' => $muscleId,
        ]);
    }

    public function test_library_renders_with_taxonomies(): void
    {
        [$chest] = $this->seedTaxonomy();
        $this->systemExercise('Bench Press', $chest->id);
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('exercises.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Exercises/Index')
                ->has('exercises.data', 1)
                ->has('muscles', 2));
    }

    public function test_search_filters_and_sort_use_backend_queries(): void
    {
        [$chest, $back] = $this->seedTaxonomy();
        $this->systemExercise('Bench Press', $chest->id);
        $row = $this->systemExercise('Barbell Row', $back->id);
        // Break the updated_at tie so "recent" ordering is deterministic.
        $row->forceFill(['updated_at' => now()->addMinutes(5)])->save();
        $user = User::factory()->create();

        // Search.
        $this->actingAs($user)->get(route('exercises.index', ['q' => 'bench']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('exercises.data', 1)
                ->where('exercises.data.0.name', 'Bench Press'));

        // Muscle filter.
        $this->actingAs($user)->get(route('exercises.index', ['muscle' => $back->id]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('exercises.data', 1)
                ->where('exercises.data.0.name', 'Barbell Row'));

        // Sort recent puts the newest first.
        $this->actingAs($user)->get(route('exercises.index', ['sort' => 'recent']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('exercises.data.0.name', 'Barbell Row'));

        // Invalid type is rejected, not silently ignored.
        $this->actingAs($user)->get(route('exercises.index', ['type' => 'nonsense']))
            ->assertSessionHasErrors('type');
    }

    public function test_reference_lists_survive_database_cache_round_trip(): void
    {
        // Regression: the database cache store unserializes with
        // `allowed_classes => false`, so caching Eloquent models makes the
        // muscles/equipment props come back as __PHP_Incomplete_Class and the
        // page renders empty filter dropdowns. Plain arrays round-trip fine.
        config()->set('cache.default', 'database');

        $this->seedTaxonomy();
        Equipment::create(['name' => 'Barbell', 'slug' => 'barbell']);
        $user = User::factory()->create();

        // First hit warms the cache rows, second hit reads them back.
        $this->actingAs($user)->get(route('exercises.index'))->assertOk();
        $this->actingAs($user)->get(route('exercises.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('muscles', 2)
                ->where('muscles.0.slug', 'back')
                ->where('muscles.1.slug', 'chest')
                ->has('equipment', 1)
                ->where('equipment.0.slug', 'barbell'));
    }

    public function test_detail_shows_performance_summary(): void
    {
        [$chest] = $this->seedTaxonomy();
        $ex = $this->systemExercise('Bench Press', $chest->id);
        $user = User::factory()->create();

        $workout = $user->workouts()->create([
            'name' => 'Push', 'status' => 'completed',
            'started_at' => now()->subDay(), 'ended_at' => now()->subDay()->addHour(),
            'duration_seconds' => 3600, 'total_volume_kg' => 640,
            'timezone' => 'Asia/Jakarta',
        ]);
        $we = $workout->exercises()->create(['exercise_id' => $ex->id, 'order' => 0]);
        $we->sets()->create([
            'order' => 0, 'set_type' => 'normal',
            'weight_kg' => 80, 'reps' => 8, 'is_completed' => true,
        ]);

        $this->actingAs($user)->get(route('exercises.show', $ex->slug))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Exercises/Show')
                ->where('bestSet.reps', 8)
                ->where('oneRm', 101.33)
                ->has('history', 1));
    }

    public function test_user_can_crud_own_custom_exercise(): void
    {
        [$chest] = $this->seedTaxonomy();
        $user = User::factory()->create();

        $create = $this->actingAs($user)->post(route('exercises.store'), [
            'name' => 'My Cable Twist',
            'exercise_type' => 'weight_reps',
            'primary_muscle_id' => $chest->id,
        ]);
        $create->assertRedirect();
        $ex = Exercise::where('name', 'My Cable Twist')->firstOrFail();
        $this->assertFalse((bool) $ex->is_system);
        $this->assertEquals($user->id, (int) $ex->created_by);

        $this->actingAs($user)->patch(route('exercises.update', $ex), [
            'name' => 'My Cable Twist v2',
            'exercise_type' => 'weight_reps',
        ])->assertRedirect();
        $this->assertEquals('My Cable Twist v2', $ex->fresh()->name);

        $this->actingAs($user)->delete(route('exercises.destroy', $ex))->assertRedirect();
        $this->assertSoftDeleted('exercises', ['id' => $ex->id]);
    }

    public function test_system_exercises_are_protected_from_normal_users(): void
    {
        $ex = $this->systemExercise();
        $user = User::factory()->create();

        $this->actingAs($user)->get(route('exercises.edit', $ex))->assertForbidden();
        $this->actingAs($user)->patch(route('exercises.update', $ex), [
            'name' => 'Hacked', 'exercise_type' => 'weight_reps',
        ])->assertForbidden();
        $this->actingAs($user)->delete(route('exercises.destroy', $ex))->assertForbidden();
        $this->assertEquals('Bench Press', $ex->fresh()->name);
    }

    public function test_users_cannot_touch_each_others_custom_exercises(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $ex = Exercise::create([
            'name' => 'Secret Move', 'slug' => 'secret-move',
            'exercise_type' => 'weight_reps', 'is_system' => false,
            'created_by' => $owner->id,
        ]);

        $this->actingAs($other)->get(route('exercises.show', $ex->slug))->assertForbidden();
        $this->actingAs($other)->patch(route('exercises.update', $ex), [
            'name' => 'Stolen', 'exercise_type' => 'weight_reps',
        ])->assertForbidden();
    }

    public function test_custom_exercise_validation(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('exercises.store'), [
            'name' => '',
            'exercise_type' => 'teleportation',
        ])->assertSessionHasErrors(['name', 'exercise_type']);
    }
}
