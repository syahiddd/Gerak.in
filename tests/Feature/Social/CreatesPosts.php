<?php

declare(strict_types=1);

namespace Tests\Feature\Social;

use App\Models\Exercise;
use App\Models\User;
use App\Models\Workout;
use Illuminate\Support\Str;

trait CreatesPosts
{
    protected function makePost(User $owner, string $visibility = 'public', string $status = 'completed'): Workout
    {
        $workout = Workout::create([
            'user_id' => $owner->id,
            'name' => 'Session '.Str::random(4),
            'status' => $status,
            'visibility' => $visibility,
            'started_at' => now()->subHour(),
            'ended_at' => $status === 'completed' ? now() : null,
            'duration_seconds' => $status === 'completed' ? 3600 : null,
            'total_volume_kg' => 1000,
        ]);

        $exercise = Exercise::create([
            'name' => 'Bench Press',
            'slug' => 'bench-'.Str::lower(Str::random(6)),
            'exercise_type' => 'weight_reps',
            'is_system' => true,
        ]);
        $we = $workout->exercises()->create(['exercise_id' => $exercise->id, 'order' => 0]);
        $we->sets()->create(['order' => 0, 'set_type' => 'normal', 'weight_kg' => 80, 'reps' => 5, 'is_completed' => true]);

        return $workout;
    }

    /** @return int[] ids of posts on the given feed tab */
    protected function feedIds(User $viewer, string $tab = 'following'): array
    {
        $ids = [];
        $this->actingAs($viewer)->get(route('feed.index', ['tab' => $tab]))
            ->assertOk()
            ->assertInertia(function ($page) use (&$ids) {
                $ids = collect($page->toArray()['props']['posts']['data'])->pluck('id')->all();
            });

        return $ids;
    }
}
