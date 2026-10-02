<?php

declare(strict_types=1);

namespace Tests\Feature\Console\Commands;

use App\Models\Exercise;
use Database\Seeders\ReferenceSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SyncGifsFromWorkoutXTest extends TestCase
{
    use RefreshDatabase;

    private Exercise $exercise;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ReferenceSeeder::class);
        Storage::fake('public');
        config()->set('services.workoutx.base_url', 'https://workoutx.test');
        config()->set('services.workoutx.key', 'test-key');
        $this->exercise = Exercise::create([
            'name' => 'Pull-Up', 'slug' => 'pull-up-wx-test', 'exercise_type' => 'bodyweight_reps', 'is_system' => true,
        ]);
    }

    private function fakeApi(): void
    {
        Http::fake([
            'workoutx.test/v1/exercises/*' => Http::response(['total' => 1, 'count' => 1, 'data' => [
                ['id' => '0651', 'name' => 'Pull Up (neutral Grip)', 'gifUrl' => 'https://workoutx.test/v1/gifs/0651.gif'],
            ]]),
            'workoutx.test/v1/gifs/*' => Http::response('GIF89a-fake', 200, ['Content-Type' => 'image/gif']),
        ]);
    }

    private function run_(array $args = [])
    {
        return $this->artisan('workoutx:sync-gifs', ['--only' => 'pull-up-wx-test', '--delay' => 0] + $args);
    }

    public function test_fails_without_api_key(): void
    {
        config()->set('services.workoutx.key', '');

        $this->artisan('workoutx:sync-gifs')
            ->expectsOutputToContain('WORKOUTX_API_KEY is empty')
            ->assertFailed();
    }

    public function test_downloads_gif_and_stores_local_path(): void
    {
        $this->fakeApi();

        $this->run_()->assertSuccessful();

        $this->assertSame('/storage/exercise-gifs/0651.gif', $this->exercise->fresh()->gif_url);
        Storage::disk('public')->assertExists('exercise-gifs/0651.gif');
        Http::assertSent(fn ($r) => $r->hasHeader('X-WorkoutX-Key', 'test-key'));
    }

    public function test_pages_until_exact_match(): void
    {
        $variant = fn (int $i) => ['id' => "v{$i}", 'name' => "Clap Pull-up {$i}", 'gifUrl' => "https://workoutx.test/v1/gifs/v{$i}.gif"];
        Http::fake([
            'workoutx.test/v1/exercises/name/pull-up?limit=10&offset=0' => Http::response(['total' => 12, 'count' => 10, 'data' => array_map($variant, range(1, 10))]),
            'workoutx.test/v1/exercises/name/pull-up?limit=10&offset=10' => Http::response(['total' => 12, 'count' => 2, 'data' => [
                $variant(11),
                ['id' => '0652', 'name' => 'Pull-up', 'gifUrl' => 'https://workoutx.test/v1/gifs/0652.gif'],
            ]]),
            'workoutx.test/v1/gifs/*' => Http::response('GIF89a-fake', 200, ['Content-Type' => 'image/gif']),
        ]);

        $this->run_()->assertSuccessful();

        $this->assertSame('/storage/exercise-gifs/0652.gif', $this->exercise->fresh()->gif_url);
    }

    public function test_dry_run_writes_nothing(): void
    {
        $this->fakeApi();

        $this->run_(['--dry-run' => true])->expectsOutputToContain('Dry run')->assertSuccessful();

        $this->assertNull($this->exercise->fresh()->gif_url);
        Storage::disk('public')->assertMissing('exercise-gifs/0651.gif');
    }

    public function test_request_errors_are_reported_as_failed_not_unmatched(): void
    {
        Http::fake(['*' => Http::response([], 500)]);

        $this->run_()->expectsOutputToContain('request failed')->assertFailed();

        $this->assertNull($this->exercise->fresh()->gif_url);
    }

    public function test_rate_limit_stops_cleanly(): void
    {
        Http::fake(['*' => Http::response([], 429)]);

        $this->run_()->expectsOutputToContain('Rate limited')->assertSuccessful();

        $this->assertNull($this->exercise->fresh()->gif_url);
    }
}
