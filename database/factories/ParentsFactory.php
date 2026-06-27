<?php

namespace Database\Factories;

use App\Models\Parents;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Parents>
 */
class ParentsFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama' => fake()->name(),
            'gender' => fake()->randomElement(['L', 'P']),
            'alamat' => fake()->address(),
            'occupation' => fake()->jobTitle(),
            'phoneNumber' => fake()->numerify('08##########'),
            'user_id' => User::factory(),
        ];
    }
}
