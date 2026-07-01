<?php

namespace Database\Factories;

use App\Models\BudgetReceipt;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<BudgetReceipt>
 */
class BudgetReceiptFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'source' => fake()->randomElement([
                'Anggaran Komite Sekolah',
                'Dana BOS',
                'Iuran Orang Tua',
                'Sumbangan Industri Mitra',
            ]),
            'description' => fake()->optional()->sentence(),
            'amount' => fake()->numberBetween(500_000, 25_000_000),
            'received_on' => fake()->dateTimeBetween('-6 months', 'now')->format('Y-m-d'),
        ];
    }
}
