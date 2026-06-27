<?php

namespace Database\Factories;

use App\Models\Pembimbing;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Pembimbing>
 */
class PembimbingFactory extends Factory
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
            'name' => fake()->name(),
            'no_hp' => fake()->numerify('08##########'),
            'gender' => fake()->randomElement(['L', 'P']),
        ];
    }
}
