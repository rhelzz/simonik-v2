<?php

namespace Database\Factories;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Student>
 */
class StudentFactory extends Factory
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
            'name' => fake()->name(),
            'nis' => fake()->unique()->numerify('##########'),
            'placeOfBirth' => fake()->city(),
            'dateOfBirth' => fake()->dateTimeBetween('-19 years', '-15 years'),
            'gender' => fake()->randomElement(['L', 'P']),
            'bloodType' => fake()->randomElement(['A', 'B', 'AB', 'O']),
            'alamat' => fake()->address(),
            'image' => 'students/'.fake()->uuid().'.jpg',
            'class_id' => Classes::factory(),
            'industri_id' => Industry::factory(),
            'departemen_id' => Departemen::factory(),
            'parent_id' => Parents::factory(),
            'teacher_id' => Teacher::factory(),
            'archived' => false,
            'status_pkl' => fake()->randomElement(['belum', 'proses', 'selesai']),
            'sertifikat_url' => null,
            'pkl_start' => null,
            'pkl_end' => null,
            'p_k_l_period_id' => null,
        ];
    }
}
