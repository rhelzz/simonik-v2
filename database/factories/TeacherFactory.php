<?php

namespace Database\Factories;

use App\Models\Departemen;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
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
            'departemen_id' => Departemen::factory(),
        ];
    }
}
