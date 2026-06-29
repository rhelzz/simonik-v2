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
        Guide::factory()->create();

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

    public function test_admin_can_upload_guide(): void
    {
        Storage::fake('public');

        $this->actingAs($this->user('admin'))
            ->post('/panduan', [
                'judul' => 'Buku Panduan PKL',
                'deskripsi' => 'Petunjuk lengkap pelaksanaan PKL.',
                'dokumen' => UploadedFile::fake()->create('panduan.pdf', 200, 'application/pdf'),
            ])
            ->assertSessionHas('success');

        $guide = Guide::firstOrFail();
        $this->assertSame('Buku Panduan PKL', $guide->judul);
        Storage::disk('public')->assertExists($guide->getRawOriginal('dokumen'));
    }

    public function test_upload_requires_a_file(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/panduan', ['judul' => 'Tanpa berkas'])
            ->assertSessionHasErrors('dokumen');
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
