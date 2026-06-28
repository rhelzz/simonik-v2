<?php

namespace Database\Factories;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Activity>
 */
class ActivityFactory extends Factory
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
            'judul' => fake()->sentence(3),
            'date' => fake()->date(),
            'start_time' => '08:00:00',
            'end_time' => '12:00:00',
            'description' => '<p>'.fake()->sentence().'</p><p><strong>'.fake()->sentence(2).'</strong> '.fake()->sentence().'</p>',
            'tools' => fake()->randomElement(['Laptop', 'PC', 'Komputer Server']),
            'image' => null,
            'verified' => fake()->randomElement(['0', '1']),
        ];
    }
}
