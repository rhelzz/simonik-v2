<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class WebsiteSettingTest extends TestCase
{
    use RefreshDatabase;

    private ?string $originalFavicon = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);

        // Uploads overwrite the real public/favicon.ico — snapshot it so the
        // repo's actual favicon isn't left replaced by test fixture bytes.
        $this->originalFavicon = file_exists(public_path('favicon.ico'))
            ? file_get_contents(public_path('favicon.ico'))
            : null;
    }

    protected function tearDown(): void
    {
        if ($this->originalFavicon !== null) {
            file_put_contents(public_path('favicon.ico'), $this->originalFavicon);
        }

        parent::tearDown();
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/pengaturan-website')->assertRedirect('/login');
    }

    public function test_non_admins_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/pengaturan-website')->assertForbidden();
    }

    public function test_admin_can_view_website_settings(): void
    {
        $this->actingAs($this->admin())->get('/pengaturan-website')->assertOk();
    }

    public function test_admin_can_upload_favicon(): void
    {
        $file = UploadedFile::fake()->create('favicon.ico', 10);

        $this->actingAs($this->admin())
            ->put('/pengaturan-website', ['favicon' => $file])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('settings', ['favicon' => 'favicon.ico']);
        $this->assertFileExists(public_path('favicon.ico'));
    }

    public function test_favicon_upload_requires_ico_file(): void
    {
        $file = UploadedFile::fake()->image('favicon.png');

        $this->actingAs($this->admin())
            ->put('/pengaturan-website', ['favicon' => $file])
            ->assertSessionHasErrors('favicon');
    }

    public function test_favicon_upload_is_required(): void
    {
        $this->actingAs($this->admin())
            ->put('/pengaturan-website', [])
            ->assertSessionHasErrors('favicon');
    }
}
