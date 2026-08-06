<?php

namespace Tests\Feature;

use App\Models\Departemen;
use App\Models\User;
use App\Support\ImportDefaults;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Seluruh akun yang dibuat dari dalam aplikasi memakai satu domain, supaya
 * operator tidak perlu mengingat variasi domain per orang.
 */
class EmailDomainTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    public function test_username_dilengkapi_domain_otomatis(): void
    {
        $this->actingAs($this->admin())
            ->post('/kaprogs', [
                'name' => 'Rasyad Helza',
                'email' => 'rasyad.helza',
                'password' => 'kata-sandi-rahasia',
                'password_confirmation' => 'kata-sandi-rahasia',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', ['email' => 'rasyad.helza@simonik.local']);
    }

    public function test_email_lengkap_tidak_diduplikasi_domainnya(): void
    {
        $this->actingAs($this->admin())
            ->post('/kaprogs', [
                'name' => 'Budi',
                'email' => 'budi@simonik.local',
                'password' => 'kata-sandi-rahasia',
                'password_confirmation' => 'kata-sandi-rahasia',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', ['email' => 'budi@simonik.local']);
    }

    public function test_domain_lain_ditolak_saat_membuat_akun(): void
    {
        $this->actingAs($this->admin())
            ->post('/kaprogs', [
                'name' => 'Budi',
                'email' => 'budi@gmail.com',
                'password' => 'kata-sandi-rahasia',
                'password_confirmation' => 'kata-sandi-rahasia',
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_akun_lama_berdomain_lain_tetap_bisa_disunting(): void
    {
        // Data lama tidak dipaksa pindah domain: menolak emailnya saat
        // disunting sama dengan mengganti kredensial login orang tanpa diminta.
        $kaprog = User::factory()->create(['email' => 'lama@sekolah.sch.id']);
        $kaprog->assignRole('kaprog');
        Departemen::factory()->create();

        $this->actingAs($this->admin())
            ->put("/kaprogs/{$kaprog->id}", [
                'name' => 'Nama Baru',
                'email' => 'lama@sekolah.sch.id',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', ['id' => $kaprog->id, 'name' => 'Nama Baru']);
    }

    public function test_impor_menerima_username_saja(): void
    {
        $csv = "Nama,Email\n"
            ."Siti Aminah,siti.aminah\n";

        $this->actingAs($this->admin())
            ->post('/wakaseks/import', [
                'file' => UploadedFile::fake()->createWithContent('import.csv', $csv),
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('users', ['email' => 'siti.aminah@simonik.local']);
    }

    public function test_domain_terpusat_di_satu_konstanta(): void
    {
        $this->assertSame('simonik.local', ImportDefaults::EMAIL_DOMAIN);
        $this->assertSame('a@simonik.local', ImportDefaults::email('A'));
        $this->assertSame('a@lain.id', ImportDefaults::email('a@lain.id'));
        $this->assertSame('', ImportDefaults::email('  '));
    }
}
