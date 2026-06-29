<?php

namespace Tests\Feature;

use App\Models\CertificateTemplate;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CertificateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function activeTemplate(): CertificateTemplate
    {
        return CertificateTemplate::factory()->active()->create([
            'anchors' => [
                ['field' => 'nama', 'x' => 50, 'y' => 45, 'size' => 6, 'align' => 'center', 'color' => '#000000', 'enabled' => true],
                ['field' => 'nis', 'x' => 50, 'y' => 55, 'size' => 3, 'align' => 'center', 'color' => '#000000', 'enabled' => false],
            ],
        ]);
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/sertifikat')->assertRedirect('/login');
    }

    public function test_disallowed_role_is_forbidden(): void
    {
        $this->actingAs($this->user('guru'))
            ->get('/sertifikat')
            ->assertForbidden();
    }

    public function test_student_is_redirected_to_own_certificate(): void
    {
        $siswa = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->get('/sertifikat')
            ->assertRedirect("/sertifikat/{$student->id}");
    }

    public function test_admin_can_view_student_list(): void
    {
        Student::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get('/sertifikat')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificates/index')
                ->has('students.data', 1)
                ->where('hasActiveTemplate', false)
            );
    }

    public function test_show_resolves_enabled_anchors_with_student_data(): void
    {
        $this->activeTemplate();
        $student = Student::factory()->create(['name' => 'Budi Santoso']);

        $this->actingAs($this->user('admin'))
            ->get("/sertifikat/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificates/show')
                // Hanya anchor enabled (nama) yang dikirim, dengan teks nyata.
                ->has('template.anchors', 1)
                ->where('template.anchors.0.text', 'Budi Santoso')
            );
    }

    public function test_show_without_active_template_returns_null(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get("/sertifikat/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('template', null));
    }

    public function test_student_cannot_view_other_students_certificate(): void
    {
        $this->activeTemplate();
        $other = Student::factory()->create();

        $this->actingAs($this->user('siswa'))
            ->get("/sertifikat/{$other->id}")
            ->assertForbidden();
    }

    public function test_student_can_view_own_certificate(): void
    {
        $this->activeTemplate();
        $siswa = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->get("/sertifikat/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('certificates/show'));
    }
}
