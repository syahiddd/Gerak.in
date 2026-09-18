<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Models\Exercise;
use Database\Seeders\ReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SyncExercisesFromExerciseDbTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceSeeder::class);
        config()->set('services.exercisedb.base_url', 'https://exercisedb.test');
        config()->set('services.exercisedb.host', 'exercisedb.test');
    }

    public function test_fails_gracefully_without_api_key(): void
    {
        config()->set('services.exercisedb.key', '');

        $this->artisan('exercisedb:sync', ['--search' => 'bench', '--dry-run' => true])
            ->expectsOutputToContain('EXERCISEDB_API_KEY is empty')
            ->assertFailed();
    }

    public function test_dry_run_writes_nothing(): void
    {
        config()->set('services.exercisedb.key', 'test-key');
        Http::fake(['*' => Http::response(['success' => true, 'data' => [$this->payload()]])]);

        $this->artisan('exercisedb:sync', ['--search' => 'pec-deck-dryrun', '--dry-run' => true])
            ->expectsOutputToContain('Dry run')
            ->assertSuccessful();

        $this->assertSame(0, Exercise::count());
    }

    public function test_sync_creates_exercise_with_media(): void
    {
        config()->set('services.exercisedb.key', 'test-key');
        Http::fake(['*' => Http::response(['success' => true, 'data' => [$this->payload()]])]);

        $this->artisan('exercisedb:sync', ['--search' => 'pec-deck-create'])
            ->expectsOutputToContain('1 created')
            ->assertSuccessful();

        $exercise = Exercise::where('external_id', 'exr_41n2hZZdH9uyYFGZ')->firstOrFail();
        $this->assertSame('Lever Pec Deck Fly', $exercise->name);
        $this->assertSame('Lever-Pec-Deck-Fly-Chest.mp4', $exercise->video_url);
        $this->assertSame('Lever-Pec-Deck-Fly-Chest.png', $exercise->image_url);
        $this->assertSame('exercisedb', $exercise->media_source);
        $this->assertNotNull($exercise->last_synced_at);
        $this->assertTrue($exercise->is_system);
        $this->assertSame(['Keep it controlled.'], $exercise->exercise_tips);
    }

    public function test_sync_is_idempotent_on_rerun(): void
    {
        config()->set('services.exercisedb.key', 'test-key');
        Http::fake(['*' => Http::response(['success' => true, 'data' => [$this->payload()]])]);

        $this->artisan('exercisedb:sync', ['--search' => 'pec-deck-idem'])->assertSuccessful();
        $this->artisan('exercisedb:sync', ['--search' => 'pec-deck-idem2'])->assertSuccessful();

        $this->assertSame(1, Exercise::where('external_id', 'exr_41n2hZZdH9uyYFGZ')->count());
    }

    /** @return array<string,mixed> */
    private function payload(): array
    {
        return [
            'exerciseId' => 'exr_41n2hZZdH9uyYFGZ',
            'name' => 'Lever Pec Deck Fly',
            'imageUrl' => 'Lever-Pec-Deck-Fly-Chest.png',
            'equipments' => ['LEVERAGE MACHINE'],
            'bodyParts' => ['CHEST'],
            'exerciseType' => 'STRENGTH',
            'targetMuscles' => ['Pectoralis Major Clavicular Head'],
            'secondaryMuscles' => ['Deltoid Anterior'],
            'videoUrl' => 'Lever-Pec-Deck-Fly-Chest.mp4',
            'keywords' => ['Chest fly'],
            'overview' => 'A chest exercise.',
            'instructions' => ['Sit down.', 'Push together.'],
            'exerciseTips' => ['Keep it controlled.'],
            'variations' => ['Cable Crossover: constant tension.'],
            'relatedExerciseIds' => ['exr_abc'],
        ];
    }
}
