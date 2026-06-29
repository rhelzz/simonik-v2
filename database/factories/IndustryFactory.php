<?php

namespace Database\Factories;

use App\Models\Industry;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Industry>
 */
class IndustryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'bidang' => fake()->randomElement(['Software House', 'Jaringan', 'Multimedia', 'Perbankan']),
            'alamat' => fake()->address(),
            'longitude' => (string) fake()->longitude(),
            'latitude' => (string) fake()->latitude(),
            'duration' => fake()->randomElement(['3 Bulan', '6 Bulan']),
            'pembimbing_id' => null,
            'teacher_id' => null,
        ];
    }
}
