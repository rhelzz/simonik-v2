<?php

namespace Database\Factories;

use App\Models\SidangAspect;
use App\Models\SidangScore;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SidangScore>
 */
class SidangScoreFactory extends Factory
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
            'sidang_aspect_id' => SidangAspect::factory(),
            'nilai' => fake()->numberBetween(70, 100),
        ];
    }
}
