<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Industry;
use App\Models\LeaveRequest;
use App\Models\Pembimbing;
use App\Models\SakitIzin;
use App\Models\Student;
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

    public function test_parent_can_only_see_stage_1_sakit_izin(): void
    {
        $siswaUser = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswaUser->id]);
        $parentUser = $this->user('orangtua');
        $parent = $student->parents;
        $parent->update(['user_id' => $parentUser->id]);

        $sakitIzin = SakitIzin::factory()->create([
            'user_id' => $siswaUser->id,
            'type' => 'sakit',
        ]);
        $approvalStage1 = Approval::initiate($sakitIzin);

        // Stage 1 pending, parent should see it
        $response = $this->actingAs($parentUser)->get('/approvals');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->has('approvals.data', 1)
            ->where('auth.pendingApprovalsCount', 1)
        );

        // Approve stage 1
        $this->actingAs($parentUser)->post("/approvals/{$approvalStage1->id}/approve")->assertRedirect();

        // Parent should not see any pending approvals count
        $responseAfter = $this->actingAs($parentUser)->get('/approvals');
        $responseAfter->assertInertia(fn (Assert $page) => $page
            ->has('approvals.data', 0)
            ->where('auth.pendingApprovalsCount', 0)
        );

        // Parent should see it in history tab
        $responseHistory = $this->actingAs($parentUser)->get('/approvals?status=history');
        $responseHistory->assertInertia(fn (Assert $page) => $page
            ->has('approvals.data', 1)
            ->where('approvals.data.0.status', 'approved')
        );
    }
}
