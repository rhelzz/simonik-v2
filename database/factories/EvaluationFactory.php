<?php

namespace Database\Factories;

use App\Models\Evaluation;
use App\Models\Industry;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Evaluation>
 */
class EvaluationFactory extends Factory
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
            'industri_id' => Industry::factory(),
            'skills' => fake()->optional()->sentence(),
            'score' => (string) fake()->numberBetween(70, 100),
            'disiplinWaktu' => (string) fake()->numberBetween(70, 100),
            'kemampuanKerja' => (string) fake()->numberBetween(70, 100),
            'kualitasKerja' => (string) fake()->numberBetween(70, 100),
            'inisiatif' => (string) fake()->numberBetween(70, 100),
            'perilaku' => (string) fake()->numberBetween(70, 100),
        ];
    }
}
