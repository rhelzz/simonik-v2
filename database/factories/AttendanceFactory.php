<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
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
            'arrivalTime' => '07:30:00',
            'departureTime' => '16:00:00',
            'absenceReason' => null,
            'image' => 'attendances/'.fake()->uuid().'.jpg',
            'longitude' => (string) fake()->longitude(),
            'latitude' => (string) fake()->latitude(),
            'status' => fake()->randomElement(['hadir', 'izin', 'sakit', 'alpha']),
            'description' => fake()->optional()->sentence(),
            'verified' => fake()->randomElement(['0', '1']),
        ];
    }
}
