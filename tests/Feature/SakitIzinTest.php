<?php

namespace Tests\Feature;

use App\Actions\ApproveRequest;
use App\Models\Approval;
use App\Models\Attendance;
use App\Models\Parents;
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

    public function test_student_must_have_parent_to_submit_sakit_izin(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        // Parent profile linked to a User without the 'orangtua' role
        $parentUser = User::factory()->create();
        $parent = Parents::factory()->create(['user_id' => $parentUser->id]);

        // Student profile linked to this parent
        Student::factory()->create([
            'user_id' => $siswa->id,
            'parent_id' => $parent->id,
        ]);

        $response = $this->actingAs($siswa)
            ->post('/sakit-izin', [
                'date' => '2026-07-01',
                'type' => 'sakit',
                'reason' => 'Siswa demam tinggi',
                'bukti' => UploadedFile::fake()->image('surat_dokter.jpg'),
            ]);

        $response->assertSessionHasErrors('date');
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

    public function test_parent_and_industry_multi_stage_approval_flow(): void
    {
        [$siswa, $student, $parentUser] = $this->setupStudentWithParent();
        $pembimbing = $this->user('pembimbing');
        $wrongParentUser = $this->user('orangtua');

        $sakitIzin = SakitIzin::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
            'type' => 'sakit',
            'reason' => 'Siswa demam tinggi',
        ]);

        $approval1 = Approval::initiate($sakitIzin);
        $action = new ApproveRequest;

        // 1. Orang tua lain TIDAK BISA menyetujui Tahap 1
        $this->assertFalse($action->canAct($approval1, $wrongParentUser));

        // 2. Pembimbing/Guru TIDAK BISA menyetujui Tahap 1
        $this->assertFalse($action->canAct($approval1, $pembimbing));

        // 3. Orang tua siswa BISA menyetujui Tahap 1
        $this->assertTrue($action->canAct($approval1, $parentUser));

        // 4. Orang tua menyetujui Tahap 1
        $action->handle($approval1, $parentUser, Approval::STATUS_APPROVED);
        $this->assertEquals(Approval::STATUS_APPROVED, $approval1->fresh()->status);

        // 5. Setelah Tahap 1 disetujui, Stage 2 (Industri) terbuat secara otomatis
        $this->assertDatabaseCount('approvals', 2);
        $approvals = $sakitIzin->approvals()->orderBy('id')->get();
        $approval2 = $approvals[1];
        $this->assertEquals(Approval::STATUS_PENDING, $approval2->status);

        // 6. Orang tua TIDAK BISA menyetujui Tahap 2
        $this->assertFalse($action->canAct($approval2, $parentUser));

        // 7. Pembimbing/Guru BISA menyetujui Tahap 2
        $this->assertTrue($action->canAct($approval2, $pembimbing));

        // 8. Selama Tahap 2 pending, record Kehadiran belum terbuat
        $this->assertDatabaseMissing('attendances', [
            'user_id' => $siswa->id,
        ]);

        // 9. Pembimbing menyetujui Tahap 2
        $action->handle($approval2, $pembimbing, Approval::STATUS_APPROVED);
        $this->assertEquals(Approval::STATUS_APPROVED, $approval2->fresh()->status);

        // 10. Record Kehadiran 'sakit' terbuat setelah Tahap 2 disetujui
        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'status' => 'sakit',
            'absenceReason' => 'Siswa demam tinggi',
        ]);

        $attendance = Attendance::where('user_id', $siswa->id)->first();
        $this->assertNotNull($attendance);
        $this->assertEquals('2026-07-01', $attendance->date->format('Y-m-d'));
    }

    public function test_rejecting_stage_1_does_not_create_stage_2_or_attendance(): void
    {
        [$siswa, $student, $parentUser] = $this->setupStudentWithParent();

        $sakitIzin = SakitIzin::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
            'type' => 'izin',
            'reason' => 'Izin keperluan keluarga',
        ]);

        $approval1 = Approval::initiate($sakitIzin);
        $action = new ApproveRequest;

        // Orang tua menolak pengajuan
        $action->handle($approval1, $parentUser, Approval::STATUS_REJECTED, 'Alasan ditolak ortu');
        $this->assertEquals(Approval::STATUS_REJECTED, $approval1->fresh()->status);

        // Tidak ada Stage 2 yang dibuat
        $this->assertDatabaseCount('approvals', 1);

        // Tidak ada record Kehadiran yang dibuat
        $this->assertDatabaseMissing('attendances', [
            'user_id' => $siswa->id,
        ]);
    }
}
