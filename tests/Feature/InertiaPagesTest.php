<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InertiaPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_sees_welcome_page(): void
    {
        $this->get('/')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Welcome'));
    }

    public function test_authenticated_pages_render_expected_components(): void
    {
        $user = User::factory()->create();

        $cases = [
            ['dashboard', 'Dashboard'],
            ['exercises.index', 'Exercises/Index'],
            ['exercises.create', 'Exercises/Create'],
            ['routines.index', 'Routines/Index'],
            ['routines.create', 'Routines/Create'],
            ['workouts.index', 'Workouts/Index'],
            ['statistics.index', 'Statistics'],
            ['records.index', 'Records'],
            ['measurements.index', 'Measurements'],
            ['settings.edit', 'Settings'],
        ];

        foreach ($cases as [$route, $component]) {
            $this->actingAs($user)->get(route($route))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page->component($component));
        }
    }

    public function test_workout_show_renders_with_props(): void
    {
        $user = User::factory()->create();
        $workout = $user->workouts()->create([
            'name' => 'Test', 'status' => 'in_progress',
            'started_at' => now(), 'timezone' => 'Asia/Jakarta',
        ]);

        $this->actingAs($user)->get(route('workouts.show', $workout))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Workouts/Show')
                ->has('workout')
                ->has('previous')
                ->has('library'));
    }
}
