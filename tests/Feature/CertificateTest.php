<?php

namespace Tests\Feature;

use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Industry;
use App\Models\Pembimbing;
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

    private function template(): CertificateTemplate
    {
        return CertificateTemplate::factory()->create([
            'anchors' => [
                ['field' => 'nama', 'x' => 50, 'y' => 45, 'size' => 6, 'align' => 'center', 'color' => '#000000', 'enabled' => true],
                ['field' => 'nis', 'x' => 50, 'y' => 55, 'size' => 3, 'align' => 'center', 'color' => '#000000', 'enabled' => false],
            ],
        ]);
    }

    /**
     * @return array{0: User, 1: Industry}
     */
    private function pembimbingWithIndustry(): array
    {
        $user = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $user->id]);
        $industry = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        return [$user, $industry];
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
                ->where('hasTemplates', false)
            );
    }

    public function test_show_lists_assigned_certificates(): void
    {
        $template = $this->template();
        $student = Student::factory()->create(['name' => 'Budi Santoso']);
        Certificate::factory()->create([
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
            'title' => 'Sertifikat Industri',
        ]);

        $this->actingAs($this->user('admin'))
            ->get("/sertifikat/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificates/show')
                ->has('certificates', 1)
                ->where('certificates.0.title', 'Sertifikat Industri')
                ->where('canManage', true)
            );
    }

    public function test_show_without_certificates_is_empty(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get("/sertifikat/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->has('certificates', 0));
    }

    public function test_wakasek_can_view_but_not_manage(): void
    {
        $student = Student::factory()->create();

        $this->actingAs($this->user('wakasek'))
            ->get("/sertifikat/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('canManage', false));
    }

    public function test_student_cannot_view_other_students_certificate(): void
    {
        $other = Student::factory()->create();

        $this->actingAs($this->user('siswa'))
            ->get("/sertifikat/{$other->id}")
            ->assertForbidden();
    }

    public function test_student_can_view_own_certificate(): void
    {
        $siswa = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->get("/sertifikat/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificates/show')
                ->where('canManage', false)
            );
    }

    public function test_admin_can_assign_certificate_to_student(): void
    {
        $template = $this->template();
        $student = Student::factory()->create();

        $this->actingAs($this->user('admin'))
            ->post("/sertifikat/{$student->id}", ['certificate_template_id' => $template->id])
            ->assertRedirect();

        $this->assertDatabaseHas('certificates', [
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);
    }

    public function test_student_cannot_assign_certificate(): void
    {
        $template = $this->template();
        $siswa = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->post("/sertifikat/{$student->id}", ['certificate_template_id' => $template->id])
            ->assertForbidden();
    }

    public function test_admin_can_revoke_certificate(): void
    {
        $template = $this->template();
        $student = Student::factory()->create();
        $certificate = Certificate::factory()->create([
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);

        $this->actingAs($this->user('admin'))
            ->delete("/sertifikat/{$student->id}/{$certificate->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('certificates', ['id' => $certificate->id]);
    }

    public function test_print_resolves_enabled_anchors_with_student_data(): void
    {
        $template = $this->template();
        $student = Student::factory()->create(['name' => 'Budi Santoso']);
        $certificate = Certificate::factory()->create([
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);

        $this->actingAs($this->user('admin'))
            ->get("/sertifikat/{$student->id}/{$certificate->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificates/print')
                ->has('template.anchors', 1)
                ->where('template.anchors.0.text', 'Budi Santoso')
                ->has('qr')
            );
    }

    public function test_print_blocks_ineligible_student(): void
    {
        $template = $this->template();
        $student = Student::factory()->create(['status_pkl' => 'proses']);
        $certificate = Certificate::factory()->create([
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);

        $this->actingAs($this->user('admin'))
            ->get("/sertifikat/{$student->id}/{$certificate->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('student.eligible', false)
            );
    }

    public function test_pembimbing_only_sees_own_industry_students(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        Student::factory()->create(['industri_id' => $industry->id]);
        Student::factory()->create(); // industri lain

        $this->actingAs($user)
            ->get('/sertifikat')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificates/index')
                ->has('students.data', 1)
            );
    }

    public function test_pembimbing_cannot_view_other_industry_student(): void
    {
        [$user] = $this->pembimbingWithIndustry();
        $other = Student::factory()->create();

        $this->actingAs($user)
            ->get("/sertifikat/{$other->id}")
            ->assertForbidden();
    }

    public function test_pembimbing_can_assign_own_industry_template_to_own_student(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        $template = CertificateTemplate::factory()->industry($industry)->create();
        $student = Student::factory()->create(['industri_id' => $industry->id]);

        $this->actingAs($user)
            ->post("/sertifikat/{$student->id}", ['certificate_template_id' => $template->id])
            ->assertRedirect();

        $this->assertDatabaseHas('certificates', [
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);
    }

    public function test_pembimbing_cannot_assign_individual_template(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        $template = $this->template(); // scope individual, bukan miliknya
        $student = Student::factory()->create(['industri_id' => $industry->id]);

        $this->actingAs($user)
            ->post("/sertifikat/{$student->id}", ['certificate_template_id' => $template->id])
            ->assertForbidden();
    }

    public function test_pembimbing_cannot_assign_to_other_industry_student(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        $template = CertificateTemplate::factory()->industry($industry)->create();
        $other = Student::factory()->create(); // industri lain

        $this->actingAs($user)
            ->post("/sertifikat/{$other->id}", ['certificate_template_id' => $template->id])
            ->assertForbidden();
    }

    public function test_pembimbing_cannot_revoke_non_industry_certificate(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        $globalTemplate = CertificateTemplate::factory()->global()->create();
        $student = Student::factory()->create(['industri_id' => $industry->id]);
        $certificate = Certificate::factory()->create([
            'student_id' => $student->id,
            'certificate_template_id' => $globalTemplate->id,
        ]);

        $this->actingAs($user)
            ->delete("/sertifikat/{$student->id}/{$certificate->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('certificates', ['id' => $certificate->id]);
    }

    public function test_pembimbing_can_revoke_own_industry_certificate(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        $template = CertificateTemplate::factory()->industry($industry)->create();
        $student = Student::factory()->create(['industri_id' => $industry->id]);
        $certificate = Certificate::factory()->create([
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);

        $this->actingAs($user)
            ->delete("/sertifikat/{$student->id}/{$certificate->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('certificates', ['id' => $certificate->id]);
    }
}
