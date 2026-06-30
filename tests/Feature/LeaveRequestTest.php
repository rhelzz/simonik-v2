<?php

namespace Tests\Feature;

use App\Actions\ApproveRequest;
use App\Models\Approval;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaveRequestTest extends TestCase
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

    public function test_student_can_view_leave_requests_index(): void
    {
        $siswa = $this->user('siswa');
        LeaveRequest::factory()->create(['user_id' => $siswa->id]);

        $response = $this->actingAs($siswa)
            ->get('/libur');

        $response->assertStatus(200);
        $response->assertSee('leaveRequests');
    }

    public function test_student_can_submit_leave_request(): void
    {
        $siswa = $this->user('siswa');

        $response = $this->actingAs($siswa)
            ->post('/libur', [
                'date' => '2026-07-01',
                'reason' => 'Ada acara keluarga penting di luar kota',
            ]);

        $response->assertRedirect('/libur');
        $this->assertDatabaseHas('leave_requests', [
            'user_id' => $siswa->id,
            'reason' => 'Ada acara keluarga penting di luar kota',
        ]);

        $leaveRequest = LeaveRequest::first();
        $this->assertNotNull($leaveRequest);
        $this->assertEquals('2026-07-01', $leaveRequest->date->format('Y-m-d'));

        // Pastikan approval pending terbuat secara otomatis
        $this->assertDatabaseHas('approvals', [
            'approvable_type' => LeaveRequest::class,
            'approvable_id' => $leaveRequest->id,
            'status' => Approval::STATUS_PENDING,
        ]);
    }

    public function test_cannot_submit_duplicate_date_leave_request(): void
    {
        $siswa = $this->user('siswa');
        LeaveRequest::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
        ]);

        $response = $this->actingAs($siswa)
            ->post('/libur', [
                'date' => '2026-07-01',
                'reason' => 'Alasan lain di tanggal yang sama',
            ]);

        $response->assertSessionHasErrors('date');
    }

    public function test_non_student_cannot_submit_leave_request(): void
    {
        $guru = $this->user('guru');

        $response = $this->actingAs($guru)
            ->post('/libur', [
                'date' => '2026-07-01',
                'reason' => 'Guru tidak berhak mengajukan libur',
            ]);

        $response->assertStatus(403);
    }

    public function test_approving_leave_request_creates_libur_attendance(): void
    {
        $siswa = $this->user('siswa');
        $leaveRequest = LeaveRequest::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
            'reason' => 'Siswa lelah magang',
        ]);

        $approval = Approval::initiate($leaveRequest);
        $pembimbing = $this->user('pembimbing');

        // Approve pengajuan libur
        (new ApproveRequest)->handle($approval, $pembimbing, Approval::STATUS_APPROVED);

        $this->assertEquals(Approval::STATUS_APPROVED, $approval->fresh()->status);

        // Pastikan record kehadiran terbuat dengan status 'libur'
        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'status' => 'libur',
            'absenceReason' => 'Siswa lelah magang',
        ]);

        $attendance = Attendance::where('user_id', $siswa->id)->first();
        $this->assertNotNull($attendance);
        $this->assertEquals('2026-07-01', $attendance->date->format('Y-m-d'));
    }

    public function test_rejecting_leave_request_does_not_create_attendance(): void
    {
        $siswa = $this->user('siswa');
        $leaveRequest = LeaveRequest::factory()->create([
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
            'reason' => 'Siswa ingin libur tanpa alasan sah',
        ]);

        $approval = Approval::initiate($leaveRequest);
        $guru = $this->user('guru');

        // Tolak pengajuan libur
        (new ApproveRequest)->handle($approval, $guru, Approval::STATUS_REJECTED, 'Alasan tidak kuat');

        $this->assertEquals(Approval::STATUS_REJECTED, $approval->fresh()->status);

        // Pastikan TIDAK ada record kehadiran yang terbuat
        $this->assertDatabaseMissing('attendances', [
            'user_id' => $siswa->id,
            'date' => '2026-07-01',
        ]);
    }
}
