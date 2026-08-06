<?php

namespace Tests\Feature;

use App\Models\Departemen;
use App\Models\Pembimbing;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Satu orang boleh memegang beberapa jabatan dengan satu akun login.
 *
 * Sebelumnya tiap modul kepegawaian selalu membuat baris `users` baru dengan
 * email unik global, jadi seorang guru yang juga kaprog terpaksa punya dua akun
 * dan dua kata sandi — penyebab keluhan "akun bentrok, tidak bisa login".
 */
class MultiRoleAccountTest extends TestCase
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

    private function guru(): User
    {
        $user = User::factory()->create(['name' => 'Siti Aminah']);
        $user->assignRole('guru');
        Teacher::factory()->create([
            'user_id' => $user->id,
            'name' => $user->name,
            'departemen_id' => Departemen::factory()->create()->id,
        ]);

        return $user;
    }

    public function test_guru_dapat_ditambahkan_sebagai_kaprog_tanpa_akun_kedua(): void
    {
        $guru = $this->guru();
        $departemen = Departemen::factory()->create();
        $admin = $this->admin();
        $before = User::count();

        $this->actingAs($admin)
            ->post('/kaprogs', [
                'user_id' => $guru->id,
                'departemen_ids' => [$departemen->id],
            ])
            ->assertRedirect(route('kaprogs.index'))
            ->assertSessionHasNoErrors();

        $this->assertSame($before, User::count(), 'Tidak boleh ada akun kedua.');
        $this->assertTrue($guru->fresh()->hasRole('kaprog'));
        $this->assertTrue($guru->fresh()->hasRole('guru'));
        $this->assertDatabaseHas('departemens', ['id' => $departemen->id, 'user_id' => $guru->id]);
    }

    public function test_akun_dua_jabatan_dapat_login_dan_membuka_dashboard(): void
    {
        $user = $this->guru();
        $user->assignRole('kaprog');

        $this->actingAs($user)->get('/dashboard')->assertOk();
    }

    public function test_dashboard_default_mengikuti_kewenangan_terluas(): void
    {
        $user = $this->guru();
        $user->assignRole('kaprog');

        // Sebelum perbaikan, `guru` diperiksa lebih dulu sehingga dashboard
        // kaprog tidak pernah terjangkau.
        $this->actingAs($user)->get('/dashboard')
            ->assertInertia(fn ($page) => $page->component('dashboard-kaprog'));

        $this->actingAs($user)->get('/dashboard?as=guru')
            ->assertInertia(fn ($page) => $page->component('dashboard-staff'));
    }

    public function test_as_diabaikan_bila_perannya_tidak_dimiliki(): void
    {
        $user = $this->guru();

        $this->actingAs($user)->get('/dashboard?as=admin')
            ->assertInertia(fn ($page) => $page->component('dashboard-staff'));
    }

    public function test_mencabut_jabatan_kaprog_tidak_menghapus_akun_gurunya(): void
    {
        $user = $this->guru();
        $user->assignRole('kaprog');
        $departemen = Departemen::factory()->create(['user_id' => $user->id]);

        $this->actingAs($this->admin())
            ->delete("/kaprogs/{$user->id}")
            ->assertSessionHas('success');

        $fresh = $user->fresh();
        $this->assertNotNull($fresh, 'Akun tidak boleh ikut terhapus.');
        $this->assertTrue($fresh->hasRole('guru'));
        $this->assertFalse($fresh->hasRole('kaprog'));
        $this->assertDatabaseHas('departemens', ['id' => $departemen->id, 'user_id' => null]);
    }

    public function test_mencabut_jabatan_terakhir_menghapus_akun(): void
    {
        $user = User::factory()->create();
        $user->assignRole('kaprog');

        $this->actingAs($this->admin())
            ->delete("/kaprogs/{$user->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_menghapus_guru_hanya_mencabut_perannya_bila_masih_pembimbing(): void
    {
        $user = User::factory()->create();
        $user->assignRole('guru');
        $user->assignRole('pembimbing');
        $teacher = Teacher::factory()->create([
            'user_id' => $user->id,
            'departemen_id' => Departemen::factory()->create()->id,
        ]);
        Pembimbing::factory()->create(['user_id' => $user->id]);

        $this->actingAs($this->admin())
            ->delete("/teachers/{$teacher->id}")
            ->assertSessionHas('success');

        $fresh = $user->fresh();
        $this->assertNotNull($fresh);
        $this->assertFalse($fresh->hasRole('guru'));
        $this->assertTrue($fresh->hasRole('pembimbing'));
        $this->assertDatabaseMissing('teachers', ['id' => $teacher->id]);
    }

    public function test_akun_siswa_tidak_dapat_diberi_jabatan_kepegawaian(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($this->admin())
            ->post('/kaprogs', ['user_id' => $siswa->id])
            ->assertSessionHasErrors('user_id');

        $this->assertFalse($siswa->fresh()->hasRole('kaprog'));
    }

    public function test_akun_yang_sudah_menjabat_ditolak(): void
    {
        $user = User::factory()->create();
        $user->assignRole('kaprog');

        $this->actingAs($this->admin())
            ->post('/kaprogs', ['user_id' => $user->id])
            ->assertSessionHasErrors('user_id');
    }

    public function test_pencarian_kandidat_menyembunyikan_siswa_dan_yang_sudah_menjabat(): void
    {
        $guru = $this->guru();

        $siswa = User::factory()->create(['name' => 'Siti Rahayu']);
        $siswa->assignRole('siswa');

        $kaprog = User::factory()->create(['name' => 'Siti Kaprog']);
        $kaprog->assignRole('kaprog');

        $this->actingAs($this->admin())
            ->get('/kaprogs/create?q=Siti')
            ->assertInertia(fn ($page) => $page
                ->has('candidates', 1)
                ->where('candidates.0.id', $guru->id));
    }

    public function test_membuat_akun_baru_masih_bisa_seperti_biasa(): void
    {
        $this->actingAs($this->admin())
            ->post('/kaprogs', [
                'name' => 'Rina Kusuma',
                'email' => 'rina@simonik.local',
                'password' => 'kata-sandi-rahasia',
                'password_confirmation' => 'kata-sandi-rahasia',
            ])
            ->assertSessionHasNoErrors();

        $user = User::where('email', 'rina@simonik.local')->firstOrFail();
        $this->assertTrue($user->hasRole('kaprog'));
    }
}
