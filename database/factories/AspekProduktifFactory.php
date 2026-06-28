<?php

namespace Database\Factories;

use App\Models\AspekProduktif;
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
            'category' => fake()->randomElement(AspekProduktif::CATEGORIES),
            'no' => fake()->numberBetween(1, 20),
            'kemampuan' => fake()->unique()->sentence(3),
        ];
    }

    /**
     * Aspek kategori teknis (diisi pembimbing industri).
     */
    public function teknis(): static
    {
        return $this->state(['category' => AspekProduktif::CATEGORY_TEKNIS]);
    }

    /**
     * Aspek kategori non-teknis (diisi guru pembimbing).
     */
    public function nonTeknis(): static
    {
        return $this->state(['category' => AspekProduktif::CATEGORY_NON_TEKNIS]);
    }
}
