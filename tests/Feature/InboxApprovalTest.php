<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Industry;
use App\Models\LeaveRequest;
use App\Models\Pembimbing;
use App\Models\SakitIzin;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class InboxApprovalTest extends TestCase
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

    public function test_non_approver_roles_are_forbidden(): void
    {
        $admin = $this->user('admin');
        $siswa = $this->user('siswa');

        $this->actingAs($admin)->get('/approvals')->assertStatus(403);
        $this->actingAs($siswa)->get('/approvals')->assertStatus(403);
    }

    public function test_pembimbing_can_see_pending_leave_request_for_scoped_student(): void
    {
        $pembimbingUser = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);
        $industry = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        $siswaUser = $this->user('siswa');
        $student = Student::factory()->create([
            'user_id' => $siswaUser->id,
            'industri_id' => $industry->id,
        ]);

        $leaveRequest = LeaveRequest::factory()->create(['user_id' => $siswaUser->id]);
        $approval = Approval::initiate($leaveRequest);

        $response = $this->actingAs($pembimbingUser)->get('/approvals');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('approvals/index')
            ->has('approvals.data', 1)
            ->where('approvals.data.0.studentName', $siswaUser->name)
            ->where('auth.pendingApprovalsCount', 1)
        );

        // Verify other pembimbing cannot see this student's leave request
        $otherPembimbingUser = $this->user('pembimbing');
        $otherPembimbing = Pembimbing::factory()->create(['user_id' => $otherPembimbingUser->id]);
        $otherIndustry = Industry::factory()->create(['pembimbing_id' => $otherPembimbing->id]);

        $otherResponse = $this->actingAs($otherPembimbingUser)->get('/approvals');
        $otherResponse->assertStatus(200);
        $otherResponse->assertInertia(fn (Assert $page) => $page
            ->has('approvals.data', 0)
            ->where('auth.pendingApprovalsCount', 0)
        );
    }

    /**
     * v2.4 Fase 26 — DIBALIK. Sakit/Izin kini satu tahap (Guru Pembimbing),
     * sehingga Orang Tua tidak punya antrean apa pun: cabang SakitIzin adalah
     * SATU-SATUNYA yang dulu melayaninya. Menyisakan menunya berarti halaman
     * yang selamanya kosong, jadi role-nya dicabut dari rute & sidebar.
     */
    public function test_parent_can_no_longer_access_approval_inbox(): void
    {
        $siswaUser = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswaUser->id]);
        $parentUser = $this->user('orangtua');
        $student->parents->update(['user_id' => $parentUser->id]);

        SakitIzin::factory()->create(['user_id' => $siswaUser->id, 'type' => 'sakit']);

        $this->actingAs($parentUser)->get('/approvals')->assertForbidden();
    }

    /**
     * Pengajuan sakit langsung masuk inbox guru — tanpa menunggu tahap apa pun.
     */
    public function test_sakit_appears_in_guru_inbox_immediately(): void
    {
        $guruUser = $this->user('guru');
        $teacher = Teacher::factory()->create(['user_id' => $guruUser->id]);
        $industry = Industry::factory()->create(['teacher_id' => $teacher->id]);

        $siswaUser = $this->user('siswa');
        Student::factory()->create([
            'user_id' => $siswaUser->id,
            'industri_id' => $industry->id,
        ]);

        $sakitIzin = SakitIzin::factory()->create([
            'user_id' => $siswaUser->id,
            'type' => 'sakit',
        ]);
        Approval::initiate($sakitIzin);

        $this->actingAs($guruUser)->get('/approvals')
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->has('approvals.data', 1)
                ->where('approvals.data.0.typeLabel', 'Sakit')
                ->where('auth.pendingApprovalsCount', 1)
            );
    }
}
