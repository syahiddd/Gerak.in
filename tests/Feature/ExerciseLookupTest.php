<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ExerciseLookupTest extends TestCase
{
    use RefreshDatabase;

    private function exercise(string $name, array $extra = []): Exercise
    {
        return Exercise::create(array_merge([
            'name' => $name,
            'slug' => Str::slug($name).'-'.Str::lower(Str::random(4)),
            'exercise_type' => 'weight_reps',
            'is_system' => true,
        ], $extra));
    }

    public function test_multi_word_search_with_prefix_matches_first(): void
    {
        $user = User::factory()->create();
        $this->exercise('Lever Pec Deck Fly');
        $this->exercise('Barbell Bench Press');
        $this->exercise('Bench Press');
        $this->exercise('Cable Crossover');

        $this->actingAs($user)->getJson(route('exercises.lookup', ['q' => 'pec deck']))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Lever Pec Deck Fly');

        $this->actingAs($user)->getJson(route('exercises.lookup', ['q' => 'bench']))
            ->assertJsonPath('data.0.name', 'Bench Press')
            ->assertJsonPath('data.1.name', 'Barbell Bench Press');
    }

    public function test_limited_to_twenty_and_excludes_other_users_custom_exercises(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create();
        for ($i = 1; $i <= 25; $i++) {
            $this->exercise("Curl Variation {$i}");
        }
        $this->exercise('Curl Mine', ['is_system' => false, 'created_by' => $me->id]);
        $this->exercise('Curl Theirs', ['is_system' => false, 'created_by' => $other->id]);

        $names = collect($this->actingAs($me)->getJson(route('exercises.lookup', ['q' => 'curl']))->json('data'))->pluck('name');

        $this->assertCount(20, $names);
        $this->assertContains('Curl Mine', $names);
        $this->assertNotContains('Curl Theirs', $names);
    }

    public function test_empty_query_prefers_recently_used_and_reports_media_credit(): void
    {
        $user = User::factory()->create();
        $used = $this->exercise('Hip Thrust', ['gif_url' => '/storage/exercise-dataset/videos/1409-x.gif', 'media_source' => 'gymvisual']);
        $this->exercise('Arnold Press', ['gif_url' => '/storage/exercise-gifs/2137.gif']);
        $workout = $user->workouts()->create(['name' => 'W', 'status' => 'completed', 'started_at' => now(), 'timezone' => 'Asia/Jakarta']);
        $workout->exercises()->create(['exercise_id' => $used->id, 'order' => 0]);

        $this->actingAs($user)->getJson(route('exercises.lookup'))
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Hip Thrust')
            ->assertJsonPath('data.0.media_credit', 'gymvisual')
            ->assertJsonPath('data.1.media_credit', 'workoutx');
    }
}
