<?php

namespace Database\Factories;

use App\Models\Industry;
use App\Models\User;
use App\Models\Visits;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Visits>
 */
class VisitsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'industri_id' => Industry::factory(),
            'visitDate' => fake()->date(),
            'visitReport' => fake()->paragraph(),
            'image' => null,
        ];
    }
}
