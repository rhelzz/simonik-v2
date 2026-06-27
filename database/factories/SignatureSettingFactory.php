<?php

namespace Database\Factories;

use App\Models\Departemen;
use App\Models\SignatureSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SignatureSetting>
 */
class SignatureSettingFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'role' => 'kepala_sekolah',
            'name' => fake()->name(),
            'ttd_path' => 'signatures/'.fake()->uuid().'.png',
            'department_id' => Departemen::factory(),
            'industry_id' => null,
        ];
    }
}
