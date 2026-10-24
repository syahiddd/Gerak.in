<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Models\Exercise;
use App\Models\Muscle;
use Database\Seeders\ReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class ImportExerciseDatasetTest extends TestCase
{
    use RefreshDatabase;

    private const BASE = 'https://dataset.test/repo';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceSeeder::class);
        Storage::fake('public');
        config()->set('services.exercise_dataset.base_url', self::BASE);
    }

    private function record(string $id, string $name, array $extra = []): array
    {
        return array_merge([
            'id' => $id,
            'name' => $name,
            'category' => 'chest',
            'body_part' => 'chest',
            'equipment' => 'barbell',
            'target' => 'pectorals',
            'secondary_muscles' => ['triceps', 'shoulders'],
            'instruction_steps' => ['en' => ['Lie on the bench.', 'Press the bar up.']],
            'instructions' => ['en' => 'Lie on the bench. Press the bar up.'],
            'media_id' => 'abc'.$id,
            'image' => "images/{$id}-abc.jpg",
            'gif_url' => "videos/{$id}-abc.gif",
            'attribution' => '© Gym visual — https://gymvisual.com/',
        ], $extra);
    }

    /** Paths that currently return HTTP 500 (mutable so a test can "recover" the CDN). */
    private array $failing = [];

    /** @param array<int,array<string,mixed>> $records */
    private function fakeRepo(array $records, array $failing = []): void
    {
        $this->failing = $failing;
        Http::fake(function ($request) use ($records) {
            $path = substr($request->url(), strlen(self::BASE) + 1);
            if ($path === 'data/exercises.json') {
                return Http::response(json_encode($records));
            }
            if (in_array($path, $this->failing, true)) {
                return Http::response('', 500);
            }

            return Http::response(str_ends_with($path, '.gif') ? 'GIF89a-fake' : 'JPEG-fake');
        });
    }

    private function local(string $name, array $extra = []): Exercise
    {
        return Exercise::create(array_merge([
            'name' => $name,
            'slug' => Str::slug($name),
            'exercise_type' => 'weight_reps',
            'is_system' => true,
        ], $extra));
    }

    public function test_creates_new_exercises_with_mapped_data_and_media(): void
    {
        $this->fakeRepo([$this->record('0025', 'barbell bench press'), $this->record('0001', '3/4 sit-up', [
            'body_part' => 'waist', 'target' => 'abs', 'equipment' => 'body weight', 'secondary_muscles' => ['hip flexors'],
        ])]);

        $this->artisan('exercises:import-dataset', ['--concurrency' => 2])->assertSuccessful();

        $bench = Exercise::where('external_id', 'gv:0025')->firstOrFail();
        $this->assertSame('Barbell Bench Press', $bench->name);
        $this->assertSame('barbell-bench-press', $bench->slug);
        $this->assertSame('gymvisual', $bench->media_source);
        $this->assertSame("Lie on the bench.\nPress the bar up.", $bench->instructions);
        $this->assertSame('chest', Muscle::find($bench->primary_muscle_id)->slug);
        $this->assertSame('/storage/exercise-dataset/videos/0025-abc.gif', $bench->gif_url);
        $this->assertSame('/storage/exercise-dataset/images/0025-abc.jpg', $bench->image_url);
        Storage::disk('public')->assertExists('exercise-dataset/videos/0025-abc.gif');

        $situp = Exercise::where('external_id', 'gv:0001')->firstOrFail();
        $this->assertSame('3/4 Sit-Up', $situp->name);
        $this->assertSame('bodyweight_reps', $situp->exercise_type->value);
        $this->assertSame('core', Muscle::find($situp->primary_muscle_id)->slug);
    }

    public function test_links_local_exercise_without_overwriting_its_workoutx_gif(): void
    {
        $bench = $this->local('Barbell Bench Press', ['gif_url' => '/storage/exercise-gifs/0025.gif']);
        $squat = $this->local('Back Squat'); // alias -> "barbell full squat", no GIF yet
        $this->fakeRepo([$this->record('0025', 'barbell bench press'), $this->record('0043', 'barbell full squat', ['target' => 'quads'])]);

        $this->artisan('exercises:import-dataset')->expectsOutputToContain('2 linked')->assertSuccessful();

        $this->assertSame(2, Exercise::count(), 'no duplicates for matched names');

        $bench->refresh();
        $this->assertSame('/storage/exercise-gifs/0025.gif', $bench->gif_url, 'WorkoutX GIF kept');
        $this->assertSame('gv:0025', $bench->external_id);
        $this->assertSame('Barbell Bench Press', $bench->name);

        $squat->refresh();
        $this->assertSame('/storage/exercise-dataset/videos/0043-abc.gif', $squat->gif_url, 'missing GIF filled from dataset');
        $this->assertSame('gymvisual', $squat->media_source);
        $this->assertSame('back-squat', $squat->slug);
    }

    public function test_rerun_is_idempotent_and_retries_failed_media(): void
    {
        $records = [$this->record('0025', 'barbell bench press'), $this->record('0026', 'barbell incline bench press')];
        $this->fakeRepo($records, failing: ['videos/0026-abc.gif']);

        $this->artisan('exercises:import-dataset')->expectsOutputToContain('1 failed')->assertSuccessful();
        $this->assertNull(Exercise::where('external_id', 'gv:0026')->value('gif_url'));

        $this->failing = []; // CDN is back
        $this->artisan('exercises:import-dataset')->expectsOutputToContain('0 created')->assertSuccessful();

        $this->assertSame(2, Exercise::count());
        $this->assertSame('/storage/exercise-dataset/videos/0026-abc.gif', Exercise::where('external_id', 'gv:0026')->value('gif_url'));
    }

    public function test_no_media_and_limit_options(): void
    {
        $this->fakeRepo([$this->record('0001', 'a one'), $this->record('0002', 'a two'), $this->record('0003', 'a three')]);

        $this->artisan('exercises:import-dataset', ['--no-media' => true, '--limit' => 2])->assertSuccessful();

        $this->assertSame(2, Exercise::count());
        $this->assertNull(Exercise::first()->gif_url);
        Http::assertNotSent(fn ($r) => str_contains($r->url(), 'videos/'));
    }

    public function test_duplicate_names_get_unique_slugs(): void
    {
        $this->fakeRepo([$this->record('0577', 'lever chest press'), $this->record('1300', 'lever chest press')]);

        $this->artisan('exercises:import-dataset', ['--no-media' => true])->assertSuccessful();

        $this->assertEqualsCanonicalizing(['lever-chest-press', 'lever-chest-press-2'], Exercise::pluck('slug')->all());
    }

    public function test_rejects_path_traversal_in_media_paths(): void
    {
        $this->fakeRepo([$this->record('0009', 'sneaky', ['gif_url' => '../../.env', 'image' => 'images/../../x.jpg'])]);

        $this->artisan('exercises:import-dataset')->assertSuccessful();

        Http::assertNotSent(fn ($r) => str_contains($r->url(), '..'));
        $this->assertNull(Exercise::where('external_id', 'gv:0009')->value('gif_url'));
    }
}
