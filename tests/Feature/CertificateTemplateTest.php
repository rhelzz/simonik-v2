<?php

namespace Tests\Feature;

use App\Models\CertificateTemplate;
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

    public function test_activate_marks_single_active_template(): void
    {
        $first = CertificateTemplate::factory()->active()->create();
        $second = CertificateTemplate::factory()->create();

        $this->actingAs($this->user('admin'))
            ->post("/certificate-templates/{$second->id}/activate")
            ->assertSessionHas('success');

        $this->assertFalse($first->refresh()->is_active);
        $this->assertTrue($second->refresh()->is_active);
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
}
