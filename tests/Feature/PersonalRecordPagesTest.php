<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Exercise;
use App\Models\PersonalRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PersonalRecordPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_pages_with_a_personal_record_render_its_label(): void
    {
        $user = User::factory()->createOne();
        $exercise = Exercise::create(['name' => 'Bench Press', 'slug' => 'bench-'.Str::random(4), 'exercise_type' => 'weight_reps', 'is_system' => true]);
        PersonalRecord::create([
            'user_id' => $user->id,
            'exercise_id' => $exercise->id,
            'record_type' => 'heaviest_weight',
            'value_primary' => 100,
            'achieved_at' => now(),
        ]);

        $this->actingAs($user)->get(route('profile.show'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('recentPrs.0.record_type_label', 'Heaviest weight'));

        $this->actingAs($user)->get(route('records.index'))->assertOk();
        $this->actingAs($user)->get(route('exercises.show', $exercise->slug))->assertOk();
    }
}
