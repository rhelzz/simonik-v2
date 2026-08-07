<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Halaman impor memakai importer yang sama dengan penyimpanan, dijalankan di
 * dalam transaksi yang dibatalkan. Menulis validator kedua khusus pratinjau
 * akan menghasilkan "pratinjau bilang aman, simpan tetap gagal" — bug yang
 * lebih menyebalkan daripada yang sedang diperbaiki.
 */
class ImportPreviewTest extends TestCase
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

    /**
     * Baris siswa: Nama, NIS, Email, lalu kolom sisanya dikosongkan.
     *
     * @return array<int, string>
     */
    private function row(string $name, string $nis, string $email, string $kelas = ''): array
    {
        return [$name, $nis, $email, '', '', '', '', '', $kelas];
    }

    public function test_pratinjau_tidak_menyimpan_apa_pun(): void
    {
        $this->actingAs($this->admin())
            ->postJson('/students/import/preview', [
                'rows' => [
                    $this->row('Ani', '111', 'ani'),
                    $this->row('Budi', '222', 'budi'),
                ],
            ])
            ->assertOk();

        $this->assertDatabaseCount('students', 0);
        $this->assertDatabaseMissing('users', ['email' => 'ani@simonik.local']);
    }

    public function test_pratinjau_menandai_baris_bermasalah(): void
    {
        $response = $this->actingAs($this->admin())
            ->postJson('/students/import/preview', [
                'rows' => [
                    $this->row('Ani', '111', 'ani'),
                    $this->row('Tanpa Email', '222', ''),
                ],
            ])
            ->assertOk();

        $issues = $response->json('issues');

        $this->assertCount(1, $issues);
        // Baris 1 tabel = baris 2 di Excel (baris 1 adalah judul kolom).
        $this->assertSame(3, $issues[0]['line']);
        $this->assertSame('failed', $issues[0]['type']);
    }

    public function test_relasi_tak_dikenal_jadi_peringatan_bukan_galat(): void
    {
        $response = $this->actingAs($this->admin())
            ->postJson('/students/import/preview', [
                'rows' => [$this->row('Ani', '111', 'ani', 'XI RPL 9')],
            ])
            ->assertOk();

        $issues = $response->json('issues');

        $this->assertCount(1, $issues);
        $this->assertSame('warning', $issues[0]['type']);
        $this->assertStringContainsString('dikosongkan', $issues[0]['message']);
    }

    public function test_pratinjau_dan_penyimpanan_memberi_putusan_yang_sama(): void
    {
        $departemen = Departemen::factory()->create();
        $class = Classes::factory()->create(['name' => 'XI RPL 1', 'departemen_id' => $departemen->id]);

        $rows = [
            $this->row('Ani', '111', 'ani', $class->name),
            $this->row('Tanpa Email', '222', ''),
            $this->row('Budi', '333', 'budi', $class->name),
        ];

        $admin = $this->admin();

        $preview = $this->actingAs($admin)
            ->postJson('/students/import/preview', ['rows' => $rows])
            ->json('issues');

        $gagalDiPratinjau = array_column(
            array_filter($preview, fn (array $issue): bool => $issue['type'] === 'failed'),
            'line',
        );

        $this->actingAs($admin)->post('/students/import', ['rows' => $rows]);

        // Yang lolos pratinjau tersimpan; yang ditolak pratinjau tidak.
        $this->assertDatabaseHas('students', ['name' => 'Ani']);
        $this->assertDatabaseHas('students', ['name' => 'Budi']);
        $this->assertDatabaseMissing('students', ['name' => 'Tanpa Email']);
        $this->assertSame([3], $gagalDiPratinjau);
    }

    public function test_baris_dari_browser_tetap_divalidasi(): void
    {
        // Pratinjau adalah kenyamanan, bukan bukti kebenaran: penyimpanan tidak
        // boleh mempercayai baris yang dikirim balik dari browser.
        $this->actingAs($this->admin())
            ->post('/students/import', [
                'rows' => [$this->row('Tanpa Email', '222', '')],
            ]);

        $this->assertDatabaseCount('students', 0);
    }

    public function test_lebih_dari_500_baris_ditolak(): void
    {
        $rows = array_fill(0, 501, $this->row('Ani', '1', 'ani'));

        $this->actingAs($this->admin())
            ->postJson('/students/import/preview', ['rows' => $rows])
            ->assertStatus(422);
    }

    public function test_halaman_impor_membawa_petunjuk_dan_judul_kolom(): void
    {
        $this->actingAs($this->admin())
            ->get('/students/import')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('import/index')
                ->where('sheet', 'Data Siswa')
                ->has('headings', 15)
                ->has('instructions', 15));
    }

    public function test_siswa_tidak_boleh_membuka_halaman_impor(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/students/import')->assertForbidden();
    }
}
