<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use Database\Seeders\ExerciseSeeder;
use Database\Seeders\ReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CuratedExercisesTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_provides_exactly_the_sixty_curated_exercises(): void
    {
        $this->seed([ReferenceSeeder::class, ExerciseSeeder::class]);
        // A second run must update in place, not duplicate the dataset-keyed rows.
        $this->seed(ExerciseSeeder::class);
        $user = User::factory()->createOne();

        $this->assertSame(60, Exercise::query()->availableTo($user)->count());
        $this->assertSame(15, Exercise::whereIn('external_id', Exercise::CURATED_EXTERNAL_IDS)->count());
    }

    public function test_seeder_reuses_an_imported_dataset_row(): void
    {
        $this->seed(ReferenceSeeder::class);
        $imported = Exercise::create([
            'name' => 'Lever Seated Fly', 'slug' => 'lever-seated-fly', 'external_id' => 'gv:0596',
            'exercise_type' => 'weight_reps', 'is_system' => true,
        ]);

        $this->seed(ExerciseSeeder::class);

        $imported->refresh();
        $this->assertSame('Pec Deck', $imported->name);
        $this->assertSame('lever-seated-fly', $imported->slug);
        $this->assertSame(1, Exercise::where('external_id', 'gv:0596')->count());
    }

    public function test_non_curated_system_exercises_are_hidden_but_still_viewable(): void
    {
        $user = User::factory()->createOne();
        $curated = Exercise::create(['name' => 'Cable Curl', 'slug' => 'cable-curl-2', 'external_id' => 'gv:0868', 'exercise_type' => 'weight_reps', 'is_system' => true]);
        $hidden = Exercise::create(['name' => '3/4 Sit-Up', 'slug' => '3-4-sit-up', 'external_id' => 'gv:0001', 'exercise_type' => 'bodyweight_reps', 'is_system' => true]);
        $mine = Exercise::create(['name' => 'My Sit-Up', 'slug' => 'my-sit-up', 'exercise_type' => 'bodyweight_reps', 'is_system' => false, 'created_by' => $user->id]);

        $this->actingAs($user)->get(route('exercises.index'))
            ->assertInertia(fn ($page) => $page->has('exercises.data', 2));

        $names = collect($this->actingAs($user)->getJson(route('exercises.lookup', ['q' => 'u']))->json('data'))->pluck('name');
        $this->assertContains($curated->name, $names);
        $this->assertContains($mine->name, $names);
        $this->assertNotContains($hidden->name, $names);

        // Old workouts link to hidden exercises; their pages must keep working.
        $this->actingAs($user)->get(route('exercises.show', $hidden->slug))->assertOk();
    }
}
