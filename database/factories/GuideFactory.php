<?php

namespace Database\Factories;

use App\Models\Guide;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Guide>
 */
class GuideFactory extends Factory
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
            'judul' => fake()->sentence(4),
            'kategori' => fake()->randomElement(['Umum', 'Jurnal', 'Presensi', 'Tata Tertib']),
            'deskripsi' => fake()->optional()->paragraph(),
            'konten' => '<p>'.fake()->paragraph().'</p>',
            'gambar' => null,
            'dokumen' => 'guides/'.fake()->uuid().'.pdf',
            'status' => Guide::STATUS_PUBLISHED,
            'urutan' => fake()->numberBetween(0, 10),
            'published_at' => now(),
        ];
    }
}
