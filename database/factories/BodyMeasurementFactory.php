<?php

namespace Database\Factories;

use App\Models\BodyMeasurement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BodyMeasurement>
 */
class BodyMeasurementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'type' => 'weight',
            'value' => fake()->randomFloat(1, 50, 120),
            'recorded_at' => fake()->dateTimeBetween('-90 days', 'now'),
        ];
    }
}
