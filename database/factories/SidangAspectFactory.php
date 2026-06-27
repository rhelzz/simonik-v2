<?php

namespace Database\Factories;

use App\Models\SidangAspect;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SidangAspect>
 */
class SidangAspectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nama_aspek' => fake()->unique()->randomElement([
                'Penguasaan Materi', 'Presentasi', 'Sikap', 'Penguasaan Alat', 'Laporan',
            ]),
        ];
    }
}
