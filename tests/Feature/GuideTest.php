<?php

namespace Tests\Feature;

use App\Models\Guide;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GuideTest extends TestCase
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

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/panduan')->assertRedirect('/login');
    }

    public function test_any_role_can_view_guides(): void
    {
        Guide::factory()->create(['status' => Guide::STATUS_PUBLISHED]);

        $this->actingAs($this->user('siswa'))
            ->get('/panduan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('guides/index')
                ->has('guides', 1)
                ->where('can.manage', false)
            );
    }

    public function test_admin_sees_manage_capability(): void
    {
        $this->actingAs($this->user('admin'))
            ->get('/panduan')
            ->assertInertia(fn (Assert $page) => $page->where('can.manage', true));
    }

    public function test_admin_can_upload_guide_with_document_and_image(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('admin'))
            ->post('/panduan', [
                'judul' => 'Buku Panduan PKL',
                'kategori' => 'Umum',
                'deskripsi' => 'Petunjuk lengkap pelaksanaan PKL.',
                'konten' => '<p>Isi panduan lengkap</p>',
                'status' => 'published',
                'urutan' => 1,
                'dokumen' => UploadedFile::fake()->create('panduan.pdf', 200, 'application/pdf'),
                'gambar' => UploadedFile::fake()->image('screenshot.png', 640, 480),
            ])
            ->assertSessionHas('success');

        $guide = Guide::firstOrFail();
        $this->assertSame('Buku Panduan PKL', $guide->judul);
        $this->assertSame('Umum', $guide->kategori);
        $this->assertSame(1, $guide->urutan);
        Storage::disk('public')->assertExists($guide->getRawOriginal('dokumen'));
        Storage::disk('public')->assertExists($guide->getRawOriginal('gambar'));
    }

    public function test_admin_can_create_guide_without_file(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/panduan', [
                'judul' => 'Panduan Tanpa Berkas',
                'konten' => '<p>Hanya teks artikel.</p>',
            ])
            ->assertSessionHas('success');

        $guide = Guide::firstOrFail();
        $this->assertSame('Panduan Tanpa Berkas', $guide->judul);
        $this->assertNull($guide->getRawOriginal('dokumen'));
    }

    public function test_create_requires_judul(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/panduan', ['deskripsi' => 'Tanpa judul'])
            ->assertSessionHasErrors('judul');
    }

    public function test_upload_rejects_invalid_file_type(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('admin'))
            ->post('/panduan', [
                'judul' => 'Berkas salah',
                'dokumen' => UploadedFile::fake()->create('virus.exe', 50),
            ])
            ->assertSessionHasErrors('dokumen');
    }

    public function test_non_admin_cannot_upload(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('siswa'))
            ->post('/panduan', [
                'judul' => 'Coba',
                'dokumen' => UploadedFile::fake()->create('panduan.pdf', 100, 'application/pdf'),
            ])
            ->assertForbidden();
    }

    public function test_non_admin_cannot_see_draft_guides(): void
    {
        Guide::factory()->create([
            'judul' => 'Panduan Tayang',
            'status' => Guide::STATUS_PUBLISHED,
        ]);
        Guide::factory()->create([
            'judul' => 'Panduan Draf',
            'status' => Guide::STATUS_DRAFT,
        ]);

        $this->actingAs($this->user('siswa'))
            ->get('/panduan')
            ->assertInertia(fn (Assert $page) => $page
                ->has('guides', 1)
                ->where('guides.0.judul', 'Panduan Tayang')
            );

        $this->actingAs($this->user('admin'))
            ->get('/panduan')
            ->assertInertia(fn (Assert $page) => $page
                ->has('guides', 2)
            );
    }

    public function test_guides_are_ordered_by_urutan(): void
    {
        Guide::factory()->create([
            'judul' => 'Panduan Kedua',
            'urutan' => 2,
            'status' => Guide::STATUS_PUBLISHED,
        ]);
        Guide::factory()->create([
            'judul' => 'Panduan Pertama',
            'urutan' => 1,
            'status' => Guide::STATUS_PUBLISHED,
        ]);

        $this->actingAs($this->user('siswa'))
            ->get('/panduan')
            ->assertInertia(fn (Assert $page) => $page
                ->where('guides.0.judul', 'Panduan Pertama')
                ->where('guides.1.judul', 'Panduan Kedua')
            );
    }

    public function test_admin_can_update_metadata_without_new_file(): void
    {
        $guide = Guide::factory()->create(['judul' => 'Lama']);

        $this->actingAs($this->user('admin'))
            ->put("/panduan/{$guide->id}", ['judul' => 'Judul Baru'])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('guides', [
            'id' => $guide->id,
            'judul' => 'Judul Baru',
        ]);
    }

    public function test_admin_can_replace_file_on_update(): void
    {
        Storage::fake('public');
        $old = UploadedFile::fake()->create('lama.pdf', 100, 'application/pdf')->store('guides', 'public');
        $guide = Guide::factory()->create(['dokumen' => $old]);

        $this->actingAs($this->user('admin'))
            ->put("/panduan/{$guide->id}", [
                'judul' => $guide->judul,
                'dokumen' => UploadedFile::fake()->create('baru.pdf', 120, 'application/pdf'),
            ])
            ->assertSessionHas('success');

        Storage::disk('public')->assertMissing($old);
        Storage::disk('public')->assertExists($guide->refresh()->getRawOriginal('dokumen'));
    }

    public function test_admin_can_delete_guide(): void
    {
        Storage::fake('public');
        $path = UploadedFile::fake()->create('hapus.pdf', 100, 'application/pdf')->store('guides', 'public');
        $guide = Guide::factory()->create(['dokumen' => $path]);

        $this->actingAs($this->user('admin'))
            ->delete("/panduan/{$guide->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('guides', ['id' => $guide->id]);
        Storage::disk('public')->assertMissing($path);
    }

    public function test_non_admin_cannot_delete(): void
    {
        $guide = Guide::factory()->create();

        $this->actingAs($this->user('siswa'))
            ->delete("/panduan/{$guide->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('guides', ['id' => $guide->id]);
    }
}
