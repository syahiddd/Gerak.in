<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Workout;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Workout>
 */
class WorkoutFactory extends Factory
{
    public function definition(): array
    {
        $started = fake()->dateTimeBetween('-60 days', 'now');

        return [
            'user_id' => User::factory(),
            'name' => fake()->words(3, true),
            'status' => 'completed',
            'started_at' => $started,
            'ended_at' => (clone $started)->modify('+1 hour'),
            'duration_seconds' => 3600,
            'total_volume_kg' => 0,
            'timezone' => 'Asia/Jakarta',
        ];
    }
}
