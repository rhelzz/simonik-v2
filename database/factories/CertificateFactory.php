<?php

namespace Database\Factories;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Certificate>
 */
class CertificateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'certificate_template_id' => CertificateTemplate::factory(),
            'certificate_id' => 'PKL-'.fake()->year().'-'.fake()->unique()->numerify('####'),
            'title' => null,
        ];
    }
}
