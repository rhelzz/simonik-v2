<?php

namespace Database\Factories;

use App\Models\GuidanceReport;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GuidanceReport>
 */
class GuidanceReportFactory extends Factory
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
            'date' => fake()->date(),
            'catatan' => fake()->paragraph(),
            'verified' => fake()->randomElement(['0', '1']),
        ];
    }
}
