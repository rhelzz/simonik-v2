<?php

namespace Database\Factories;

use App\Models\Departemen;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Departemen>
 */
class DepartemenFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->randomElement([
            'Rekayasa Perangkat Lunak',
            'Teknik Komputer dan Jaringan',
            'Multimedia',
            'Akuntansi',
            'Otomatisasi dan Tata Kelola Perkantoran',
        ]);

        return [
            'name' => $name,
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(1, 99999),
            'user_id' => User::factory(),
        ];
    }
}
