<?php

namespace Database\Factories;

use App\Models\SidangResult;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SidangResult>
 */
class SidangResultFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'deskripsi' => fake()->optional()->paragraph(),
            'penguji_1' => fake()->name(),
            'penguji_2' => fake()->name(),
            'status' => fake()->randomElement(['draft', 'dinilai', 'sertifikat']),
        ];
    }
}
