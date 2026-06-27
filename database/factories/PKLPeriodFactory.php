<?php

namespace Database\Factories;

use App\Models\PKLPeriod;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PKLPeriod>
 */
class PKLPeriodFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $start = fake()->dateTimeBetween('-1 year', 'now');

        return [
            'name_period' => 'Gelombang '.fake()->numberBetween(1, 4).' '.fake()->year(),
            'start_period' => $start,
            'end_period' => (clone $start)->modify('+3 months'),
        ];
    }
}
