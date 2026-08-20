<?php

namespace Tests\Feature;

use App\Actions\ApproveRequest;
use App\Models\Approval;
use App\Models\Attendance;
use App\Models\SakitIzin;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SakitIzinTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        Storage::fake('public');
    }

    private function setupStudentWithParent(): array
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $parentUser = User::factory()->create();
        $parentUser->assignRole('orangtua');

        $parent = $student->parents;
        $parent->update(['user_id' => $parentUser->id]);

        return [$siswa, $student, $parentUser, $parent];
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    /**
     * v2.4 Fase 26 — DIBALIK dari aturan lama. Dulu siswa WAJIB menautkan akun
     * Orang Tua sebelum bisa mengajukan sakit/izin; sekarang tidak lagi, dan
     * pengajuannya langsung menunggu Guru Pembimbing.
     */
    public function test_student_without_parent_can_submit_sakit_izin(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');
        Student::factory()->create(['user_id' => $siswa->id, 'parent_id' => null]);

        $this->actingAs($siswa)
            ->post('/sakit-izin', [
                'date' => '2026-07-01',
                'type' => 'sakit',
                'reason' => 'Siswa demam tinggi',
                'bukti' => UploadedFile::fake()->image('surat_dokter.jpg'),
            ])
            ->assertRedirect('/sakit-izin')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('sakit_izins', ['user_id' => $siswa->id]);
        $this->assertDatabaseCount('approvals', 1);
    }

    /** Izin pun tidak lagi butuh Orang Tua (dikonfirmasi user: satu tahap saja). */
    public function test_student_without_parent_can_submit_izin(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');
        Student::factory()->create(['user_id' => $siswa->id, 'parent_id' => null]);

        $this->actingAs($siswa)
            ->post('/sakit-izin', [
                'date' => '2026-07-02',
                'type' => 'izin',
                'reason' => 'Keperluan keluarga',
                'bukti' => UploadedFile::fake()->image('surat.jpg'),
            ])
            ->assertRedirect('/sakit-izin')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('approvals', 1);
    }

    /** Bukti tetap WAJIB — satu-satunya pengaman tersisa setelah tahap Ortu hilang. */
    public function test_bukti_is_still_required(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');
        Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->post('/sakit-izin', [
                'date' => '2026-07-01',
                'type' => 'sakit',
                'reason' => 'Siswa demam tinggi',
            ])
            ->assertSessionHasErrors('bukti');

        $this->assertDatabaseCount('sakit_izins', 0);
    }

    public function test_student_can_submit_sakit_izin(): void
    {
        [$siswa, $student, $parentUser] = $this->setupStudentWithParent();

        $response = $this->actingAs($siswa)
            ->post('/sakit-izin', [
                'date' => '2026-07-01',
                'type' => 'sakit',
                'reason' => 'Siswa demam tinggi',
                'bukti' => UploadedFile::fake()->image('surat_dokter.jpg'),
            ]);

        $response->assertRedirect('/sakit-izin');
        $this->assertDatabaseHas('sakit_izins', [
            'user_id' => $siswa->id,
            'type' => 'sakit',
            'reason' => 'Siswa demam tinggi',
        ]);

        $sakitIzin = SakitIzin::first();
        $this->assertNotNull($sakitIzin);
        $this->assertEquals('2026-07-01', $sakitIzin->date->format('Y-m-d'));
        $this->assertNotNull($sakitIzin->getRawOriginal('bukti'));

        // Pastikan approval pertama (Stage 1 - Ortu) terbuat secara pending
        $this->assertDatabaseHas('approvals', [
            'approvable_type' => SakitIzin::class,
            'approvable_id' => $sakitIzin->id,
            'status' => Approval::STATUS_PENDING,
        ]);
    }

    /**
     * v2.4 Fase 26 — DIBALIK dari alur dua tahap. Sakit/Izin kini satu tahap:
     * Guru Pembimbing / Pembimbing Industri / Kaprog. Orang Tua tidak lagi
     * terlibat sama sekali.
     */
    public function test_single_stage_approval_flow(): void
    {
        [$siswa, $student, $parentUser] = $this->setupStudentWithParent();
        $pembimbing = $this->user('pembimbing');

        $sakitIzin = SakitIzin::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
            'type' => 'sakit',
            'reason' => 'Siswa demam tinggi',
        ]);

        $approval = Approval::initiate($sakitIzin);
        $action = new ApproveRequest;

        // Orang tua TIDAK LAGI berwenang, meski anaknya sendiri.
        $this->assertFalse($action->canAct($approval, $parentUser));

        // Pembimbing/Guru langsung berwenang — tanpa menunggu tahap apa pun.
        $this->assertTrue($action->canAct($approval, $pembimbing));

        $action->handle($approval, $pembimbing, Approval::STATUS_APPROVED);

        // Tidak ada tahap kedua yang dibuat.
        $this->assertDatabaseCount('approvals', 1);

        // Presensi 'sakit' langsung terbentuk dari satu persetujuan.
        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'status' => 'sakit',
            'absenceReason' => 'Siswa demam tinggi',
        ]);

        $attendance = Attendance::where('user_id', $siswa->id)->first();
        $this->assertNotNull($attendance);
        $this->assertEquals('2026-07-01', $attendance->date->format('Y-m-d'));

        // Bukti disimpan sebagai PATH, bukan URL asset() — kalau accessor
        // bocor ke sini, foto bukti rusak di rekap absen.
        $this->assertSame($sakitIzin->getRawOriginal('bukti'), $attendance->getRawOriginal('image'));
    }

    /**
     * Pengajuan LAMA yang terlanjur dua tahap harus tetap bisa dituntaskan —
     * kalau tidak, pengajuan yang sedang berjalan di produksi menggantung
     * selamanya tanpa gejala.
     */
    public function test_legacy_two_stage_sakit_can_still_be_completed(): void
    {
        [$siswa] = $this->setupStudentWithParent();
        $pembimbing = $this->user('pembimbing');

        $sakitIzin = SakitIzin::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
            'type' => 'sakit',
            'reason' => 'Demam',
        ]);

        // Bentuk data lama: tahap 1 sudah approved, tahap 2 masih pending.
        Approval::create([
            'approvable_type' => SakitIzin::class,
            'approvable_id' => $sakitIzin->id,
            'status' => Approval::STATUS_APPROVED,
        ]);
        $stage2 = Approval::create([
            'approvable_type' => SakitIzin::class,
            'approvable_id' => $sakitIzin->id,
            'status' => Approval::STATUS_PENDING,
        ]);

        $action = new ApproveRequest;
        $this->assertTrue($action->canAct($stage2, $pembimbing));

        $action->handle($stage2, $pembimbing, Approval::STATUS_APPROVED);

        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'status' => 'sakit',
        ]);
    }

    /**
     * Penolakan tetap berarti tidak ada baris presensi. Siswa itu lalu jatuh
     * ke definisi "belum presensi" (Fase 23) dan, pada tanggal lampau,
     * ditampilkan sebagai Alpha (Fase 27) — rantainya konsisten tanpa kode
     * penghubung.
     */
    public function test_rejecting_creates_no_attendance(): void
    {
        [$siswa] = $this->setupStudentWithParent();
        $pembimbing = $this->user('pembimbing');

        $sakitIzin = SakitIzin::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
            'type' => 'izin',
            'reason' => 'Izin keperluan keluarga',
        ]);

        $approval = Approval::initiate($sakitIzin);
        $action = new ApproveRequest;

        $action->handle($approval, $pembimbing, Approval::STATUS_REJECTED, 'Alasan ditolak');

        $this->assertEquals(Approval::STATUS_REJECTED, $approval->fresh()->status);
        $this->assertDatabaseCount('approvals', 1);
        $this->assertDatabaseMissing('attendances', ['user_id' => $siswa->id]);
    }
}
