<?php

namespace Database\Factories;

use App\Models\CertificateTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CertificateTemplate>
 */
class CertificateTemplateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3),
            'background_path' => 'certificate-templates/'.fake()->uuid().'.png',
            'anchors' => [
                ['field' => 'nama', 'x' => 50, 'y' => 45, 'size' => 32, 'align' => 'center', 'color' => '#1f2937', 'enabled' => true],
                ['field' => 'nomor', 'x' => 50, 'y' => 60, 'size' => 16, 'align' => 'center', 'color' => '#1f2937', 'enabled' => true],
                ['field' => 'industri', 'x' => 50, 'y' => 70, 'size' => 18, 'align' => 'center', 'color' => '#1f2937', 'enabled' => true],
            ],
            'is_active' => false,
        ];
    }

    /**
     * Tandai template sebagai aktif.
     */
    public function active(): static
    {
        return $this->state(fn (): array => ['is_active' => true]);
    }
}
