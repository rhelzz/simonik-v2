<?php

namespace Database\Factories;

use App\Models\SakitIzin;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SakitIzin>
 */
class SakitIzinFactory extends Factory
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
            'date' => fake()->date(),
            'type' => fake()->randomElement(['sakit', 'izin']),
            'reason' => fake()->sentence(),
            'bukti' => 'sakit_izins/'.fake()->uuid().'.jpg',
        ];
    }
}
