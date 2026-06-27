<?php

namespace Database\Factories;

use App\Models\Classes;
use App\Models\Departemen;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Classes>
 */
class ClassesFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = 'XII '.fake()->unique()->bothify('RPL-##');

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'departemen_id' => Departemen::factory(),
        ];
    }
}
