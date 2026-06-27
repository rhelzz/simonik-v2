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
            'dokumen' => 'guides/'.fake()->uuid().'.pdf',
        ];
    }
}
