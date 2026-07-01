<?php

namespace Database\Factories;

use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category' => fake()->randomElement([
                'Transport Monitoring',
                'Konsumsi Kegiatan',
                'Cetak Sertifikat',
                'Administrasi',
                'Kunjungan Industri',
            ]),
            'description' => fake()->optional()->sentence(),
            'amount' => fake()->numberBetween(50_000, 5_000_000),
            'spent_on' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
        ];
    }
}
