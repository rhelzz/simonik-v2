<?php

namespace Database\Factories;

use App\Models\AspekProduktif;
use App\Models\Evaluation;
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
            'aspek_produktif_id' => AspekProduktif::factory(),
            'score' => fake()->numberBetween(0, 100),
        ];
    }
}
