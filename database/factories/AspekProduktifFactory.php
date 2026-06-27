<?php

namespace Database\Factories;

use App\Models\AspekProduktif;
use App\Models\Industry;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AspekProduktif>
 */
class AspekProduktifFactory extends Factory
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
            'name' => fake()->words(3, true),
            'score' => (string) fake()->numberBetween(70, 100),
        ];
    }
}
