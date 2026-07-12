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
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CertificateTemplateTest extends TestCase
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

    /**
     * @return array<int, array<string, mixed>>
     */
    private function anchors(): array
    {
        return [
            ['field' => 'nama', 'x' => 50, 'y' => 45, 'size' => 6, 'align' => 'center', 'color' => '#000000', 'enabled' => true],
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/certificate-templates')->assertRedirect('/login');
    }

    public function test_non_admin_is_forbidden(): void
    {
        $this->actingAs($this->user('siswa'))
            ->get('/certificate-templates')
            ->assertForbidden();
    }

    public function test_admin_can_view_templates(): void
    {
        CertificateTemplate::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get('/certificate-templates')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificate-templates/index')
                ->has('templates', 1)
            );
    }

    public function test_admin_can_create_template(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('admin'))
            ->post('/certificate-templates', [
                'name' => 'Sertifikat 2026',
                'background' => UploadedFile::fake()->image('bg.png', 1000, 700),
                'anchors' => json_encode($this->anchors()),
            ])
            ->assertRedirect('/certificate-templates');

        $template = CertificateTemplate::firstOrFail();
        $this->assertSame('Sertifikat 2026', $template->name);
        $this->assertCount(1, $template->anchors);
        Storage::disk('public')->assertExists($template->background_path);
    }

    public function test_admin_can_create_template_with_font_and_signature(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('admin'))
            ->post('/certificate-templates', [
                'name' => 'Sertifikat TTD',
                'background' => UploadedFile::fake()->image('bg.png', 1000, 700),
                'anchors' => json_encode([
                    ['field' => 'nama', 'x' => 50, 'y' => 45, 'size' => 6, 'align' => 'center', 'color' => '#000000', 'font' => 'Playfair Display', 'enabled' => true],
                ]),
                'signature' => UploadedFile::fake()->image('ttd.png', 300, 120),
                'signaturePos' => json_encode(['x' => 70, 'y' => 82, 'width' => 18]),
            ])
            ->assertRedirect('/certificate-templates');

        $template = CertificateTemplate::firstOrFail();
        $this->assertSame('Playfair Display', $template->anchors[0]['font']);
        $this->assertNotNull($template->signature_path);
        $this->assertSame(18.0, (float) $template->signature['width']);
        Storage::disk('public')->assertExists($template->signature_path);
    }

    public function test_create_rejects_unknown_font(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('admin'))
            ->post('/certificate-templates', [
                'name' => 'Font aneh',
                'background' => UploadedFile::fake()->image('bg.png'),
                'anchors' => json_encode([
                    ['field' => 'nama', 'x' => 50, 'y' => 45, 'size' => 6, 'align' => 'center', 'color' => '#000', 'font' => 'Comic Sans MS', 'enabled' => true],
                ]),
            ])
            ->assertSessionHasErrors('anchors.0.font');
    }

    public function test_admin_can_remove_signature(): void
    {
        Storage::fake('public');
        $path = UploadedFile::fake()->image('ttd.png')->store('certificate-signatures', 'public');
        $template = CertificateTemplate::factory()->create([
            'signature_path' => $path,
            'signature' => ['x' => 70, 'y' => 80, 'width' => 20],
        ]);

        $this->actingAs($this->user('admin'))
            ->put("/certificate-templates/{$template->id}", [
                'name' => $template->name,
                'anchors' => json_encode($this->anchors()),
                'removeSignature' => '1',
            ])
            ->assertRedirect('/certificate-templates');

        $template->refresh();
        $this->assertNull($template->signature_path);
        $this->assertNull($template->signature);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_create_requires_background_and_anchors(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/certificate-templates', ['name' => 'Tanpa berkas'])
            ->assertSessionHasErrors(['background', 'anchors']);
    }

    public function test_create_rejects_unknown_anchor_field(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('admin'))
            ->post('/certificate-templates', [
                'name' => 'Salah field',
                'background' => UploadedFile::fake()->image('bg.png'),
                'anchors' => json_encode([
                    ['field' => 'hacker', 'x' => 1, 'y' => 1, 'size' => 5, 'align' => 'center', 'color' => '#000', 'enabled' => true],
                ]),
            ])
            ->assertSessionHasErrors('anchors.0.field');
    }

    public function test_admin_can_update_without_new_background(): void
    {
        $template = CertificateTemplate::factory()->create(['name' => 'Lama']);

        $this->actingAs($this->user('admin'))
            ->put("/certificate-templates/{$template->id}", [
                'name' => 'Baru',
                'anchors' => json_encode($this->anchors()),
            ])
            ->assertRedirect('/certificate-templates');

        $this->assertDatabaseHas('certificate_templates', [
            'id' => $template->id,
            'name' => 'Baru',
        ]);
    }

    public function test_toggle_global_flips_flag(): void
    {
        $template = CertificateTemplate::factory()->create();

        $this->actingAs($this->user('admin'))
            ->post("/certificate-templates/{$template->id}/toggle-global")
            ->assertSessionHas('success');

        $this->assertSame(CertificateTemplate::SCOPE_GLOBAL, $template->refresh()->scope);

        $this->actingAs($this->user('admin'))
            ->post("/certificate-templates/{$template->id}/toggle-global")
            ->assertSessionHas('success');

        $this->assertSame(CertificateTemplate::SCOPE_INDIVIDUAL, $template->refresh()->scope);
    }

    public function test_marking_template_global_stamps_all_existing_students(): void
    {
        $template = CertificateTemplate::factory()->create();
        $student = Student::factory()->create();

        $this->actingAs($this->user('admin'))
            ->post("/certificate-templates/{$template->id}/toggle-global")
            ->assertSessionHas('success');

        $this->assertDatabaseHas('certificates', [
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);
    }

    public function test_disabling_global_does_not_revoke_existing_certificates(): void
    {
        $template = CertificateTemplate::factory()->global()->create();
        $student = Student::factory()->create();
        Certificate::factory()->create([
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);

        $this->actingAs($this->user('admin'))
            ->post("/certificate-templates/{$template->id}/toggle-global")
            ->assertSessionHas('success');

        $this->assertDatabaseHas('certificates', [
            'student_id' => $student->id,
            'certificate_template_id' => $template->id,
        ]);
    }

    public function test_admin_can_delete_template(): void
    {
        Storage::fake('public');
        $path = UploadedFile::fake()->image('bg.png')->store('certificate-templates', 'public');
        $template = CertificateTemplate::factory()->create(['background_path' => $path]);

        $this->actingAs($this->user('admin'))
            ->delete("/certificate-templates/{$template->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('certificate_templates', ['id' => $template->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_non_admin_cannot_create(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('siswa'))
            ->post('/certificate-templates', [
                'name' => 'Coba',
                'background' => UploadedFile::fake()->image('bg.png'),
                'anchors' => json_encode($this->anchors()),
            ])
            ->assertForbidden();
    }

    public function test_pembimbing_creates_template_scoped_to_own_industry(): void
    {
        Storage::fake('public');
        [$user, $industry] = $this->pembimbingWithIndustry();

        $this->actingAs($user)
            ->post('/certificate-templates', [
                'name' => 'Sertifikat Industri A',
                'background' => UploadedFile::fake()->image('bg.png'),
                'anchors' => json_encode($this->anchors()),
            ])
            ->assertRedirect('/certificate-templates');

        $template = CertificateTemplate::firstOrFail();
        $this->assertSame(CertificateTemplate::SCOPE_INDUSTRY, $template->scope);
        $this->assertSame($industry->id, $template->industry_id);
    }

    public function test_pembimbing_without_industry_cannot_create(): void
    {
        Storage::fake('public');
        $user = $this->user('pembimbing');

        $this->actingAs($user)
            ->post('/certificate-templates', [
                'name' => 'Coba',
                'background' => UploadedFile::fake()->image('bg.png'),
                'anchors' => json_encode($this->anchors()),
            ])
            ->assertForbidden();
    }

    public function test_pembimbing_only_sees_own_industry_templates(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        CertificateTemplate::factory()->create(); // individual — bukan miliknya
        CertificateTemplate::factory()->global()->create(); // global — bukan miliknya
        CertificateTemplate::factory()->industry($industry)->create(); // miliknya

        $this->actingAs($user)
            ->get('/certificate-templates')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('certificate-templates/index')
                ->has('templates', 1)
            );
    }

    public function test_pembimbing_cannot_edit_others_template(): void
    {
        [$user] = $this->pembimbingWithIndustry();
        $template = CertificateTemplate::factory()->create();

        $this->actingAs($user)
            ->put("/certificate-templates/{$template->id}", [
                'name' => 'Diubah',
                'anchors' => json_encode($this->anchors()),
            ])
            ->assertForbidden();
    }

    public function test_pembimbing_cannot_delete_others_template(): void
    {
        [$user] = $this->pembimbingWithIndustry();
        $template = CertificateTemplate::factory()->global()->create();

        $this->actingAs($user)
            ->delete("/certificate-templates/{$template->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('certificate_templates', ['id' => $template->id]);
    }

    public function test_pembimbing_can_update_own_template(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        $template = CertificateTemplate::factory()->industry($industry)->create(['name' => 'Lama']);

        $this->actingAs($user)
            ->put("/certificate-templates/{$template->id}", [
                'name' => 'Baru',
                'anchors' => json_encode($this->anchors()),
            ])
            ->assertRedirect('/certificate-templates');

        $this->assertDatabaseHas('certificate_templates', ['id' => $template->id, 'name' => 'Baru']);
    }

    public function test_pembimbing_cannot_toggle_global(): void
    {
        [$user, $industry] = $this->pembimbingWithIndustry();
        $template = CertificateTemplate::factory()->industry($industry)->create();

        $this->actingAs($user)
            ->post("/certificate-templates/{$template->id}/toggle-global")
            ->assertForbidden();
    }
}
