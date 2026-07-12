<?php

namespace Database\Factories;

use App\Models\CertificateTemplate;
use App\Models\Industry;
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
            'scope' => CertificateTemplate::SCOPE_INDIVIDUAL,
        ];
    }

    /**
     * Tandai template sebagai global (otomatis tertera ke semua siswa).
     */
    public function global(): static
    {
        return $this->state(fn (): array => ['scope' => CertificateTemplate::SCOPE_GLOBAL]);
    }

    /**
     * Tandai template sebagai milik satu industri.
     */
    public function industry(Industry|int|null $industry = null): static
    {
        return $this->state(fn (): array => [
            'scope' => CertificateTemplate::SCOPE_INDUSTRY,
            'industry_id' => $industry instanceof Industry ? $industry->id : ($industry ?? Industry::factory()),
        ]);
    }
}
