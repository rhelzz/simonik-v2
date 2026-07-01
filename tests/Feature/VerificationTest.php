<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Services\QrCodeGenerator;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class VerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    public function test_valid_signature_shows_authenticity_record(): void
    {
        $student = Student::factory()->create(['name' => 'Siti Aminah', 'status_pkl' => 'selesai']);

        $url = URL::signedRoute('verification.show', ['student' => $student->id]);

        $this->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('verification/show')
                ->where('valid', true)
                ->where('record.name', 'Siti Aminah')
                ->where('record.completed', true)
                ->has('record.nomor')
            );
    }

    public function test_missing_signature_does_not_leak_data(): void
    {
        $student = Student::factory()->create();

        $this->get("/verifikasi/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('verification/show')
                ->where('valid', false)
                ->where('record', null)
            );
    }

    public function test_tampered_signature_is_rejected(): void
    {
        $student = Student::factory()->create();

        $url = URL::signedRoute('verification.show', ['student' => $student->id]);

        $this->get($url.'tampered')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('valid', false)
                ->where('record', null)
            );
    }

    public function test_generated_qr_url_passes_verification(): void
    {
        $student = Student::factory()->create();

        $url = app(QrCodeGenerator::class)->verificationUrl($student);

        $this->get($url)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('valid', true));
    }

    public function test_verification_page_is_public(): void
    {
        $student = Student::factory()->create();
        $url = URL::signedRoute('verification.show', ['student' => $student->id]);

        // Tanpa autentikasi sama sekali — tetap dapat diakses.
        $this->get($url)->assertOk();
    }
}
