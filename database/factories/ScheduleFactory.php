<?php

namespace Database\Factories;

use App\Models\Industry;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Schedule>
 */
class ScheduleFactory extends Factory
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
            'industri_id' => Industry::factory(),
            'date' => fake()->date(),
            'status' => fake()->randomElement(['terjadwal', 'selesai', 'batal']),
        ];
    }
}
