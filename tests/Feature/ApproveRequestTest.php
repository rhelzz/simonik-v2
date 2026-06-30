<?php

namespace Tests\Feature;

use App\Actions\ApproveRequest;
use App\Models\Approval;
use App\Models\Attendance;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApproveRequestTest extends TestCase
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

    private function pendingApproval(): Approval
    {
        $attendance = Attendance::factory()->create();

        return Approval::initiate($attendance);
    }

    // ─── Unit: canAct() ───────────────────────────────────────────────────────

    public function test_pembimbing_can_act_on_pending_approval(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $pembimbing = $this->user('pembimbing');

        $this->assertTrue($action->canAct($approval, $pembimbing));
    }

    public function test_guru_can_act_on_pending_approval(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $guru = $this->user('guru');

        $this->assertTrue($action->canAct($approval, $guru));
    }

    public function test_kaprog_can_act_as_fallback(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $kaprog = $this->user('kaprog');

        $this->assertTrue($action->canAct($approval, $kaprog));
    }

    public function test_unauthorized_role_cannot_act(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();

        foreach (['siswa', 'orangtua', 'admin', 'wakasek'] as $role) {
            $user = $this->user($role);
            $this->assertFalse($action->canAct($approval, $user), "Role {$role} seharusnya tidak bisa bertindak");
        }
    }

    public function test_cannot_act_on_already_resolved_approval(): void
    {
        $action = new ApproveRequest;
        $pembimbing = $this->user('pembimbing');

        $approved = $this->pendingApproval();
        $action->handle($approved, $pembimbing, Approval::STATUS_APPROVED);

        $this->assertFalse($action->canAct($approved->fresh(), $pembimbing));
    }

    // ─── Unit: handle() — First-to-Approve ───────────────────────────────────

    public function test_pembimbing_can_approve(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $pembimbing = $this->user('pembimbing');

        $action->handle($approval, $pembimbing, Approval::STATUS_APPROVED);

        $fresh = $approval->fresh();
        $this->assertEquals(Approval::STATUS_APPROVED, $fresh->status);
        $this->assertEquals($pembimbing->id, $fresh->approver_id);
        $this->assertEquals('pembimbing', $fresh->approver_role);
    }

    public function test_guru_can_approve(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $guru = $this->user('guru');

        $action->handle($approval, $guru, Approval::STATUS_APPROVED);

        $fresh = $approval->fresh();
        $this->assertEquals(Approval::STATUS_APPROVED, $fresh->status);
        $this->assertEquals($guru->id, $fresh->approver_id);
        $this->assertEquals('guru', $fresh->approver_role);
    }

    public function test_kaprog_can_approve_as_fallback(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $kaprog = $this->user('kaprog');

        $action->handle($approval, $kaprog, Approval::STATUS_APPROVED);

        $fresh = $approval->fresh();
        $this->assertEquals(Approval::STATUS_APPROVED, $fresh->status);
        $this->assertEquals('kaprog', $fresh->approver_role);
    }

    public function test_can_reject(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $guru = $this->user('guru');

        $action->handle($approval, $guru, Approval::STATUS_REJECTED, 'Alasan penolakan');

        $fresh = $approval->fresh();
        $this->assertEquals(Approval::STATUS_REJECTED, $fresh->status);
        $this->assertEquals('Alasan penolakan', $fresh->note);
        $this->assertEquals($guru->id, $fresh->approver_id);
    }

    public function test_first_approver_wins(): void
    {
        $action = new ApproveRequest;
        $approval = $this->pendingApproval();
        $pembimbing = $this->user('pembimbing');
        $guru = $this->user('guru');

        // Pembimbing approve lebih dulu.
        $action->handle($approval, $pembimbing, Approval::STATUS_APPROVED);

        // Guru sudah tidak bisa bertindak karena sudah resolved.
        $this->assertFalse($action->canAct($approval->fresh(), $guru));
    }

    // ─── HTTP: endpoint approve & reject ─────────────────────────────────────

    public function test_approve_via_http(): void
    {
        $approval = $this->pendingApproval();
        $pembimbing = $this->user('pembimbing');

        $this->actingAs($pembimbing)
            ->post("/approvals/{$approval->id}/approve")
            ->assertRedirect();

        $this->assertEquals(Approval::STATUS_APPROVED, $approval->fresh()->status);
    }

    public function test_reject_via_http(): void
    {
        $approval = $this->pendingApproval();
        $guru = $this->user('guru');

        $this->actingAs($guru)
            ->post("/approvals/{$approval->id}/reject", ['note' => 'Tidak valid'])
            ->assertRedirect();

        $fresh = $approval->fresh();
        $this->assertEquals(Approval::STATUS_REJECTED, $fresh->status);
        $this->assertEquals('Tidak valid', $fresh->note);
    }

    public function test_siswa_cannot_approve_via_http(): void
    {
        $approval = $this->pendingApproval();
        $siswa = $this->user('siswa');

        $this->actingAs($siswa)
            ->post("/approvals/{$approval->id}/approve")
            ->assertForbidden();
    }

    public function test_kaprog_approve_via_http(): void
    {
        $approval = $this->pendingApproval();
        $kaprog = $this->user('kaprog');

        $this->actingAs($kaprog)
            ->post("/approvals/{$approval->id}/approve")
            ->assertRedirect();

        $this->assertEquals(Approval::STATUS_APPROVED, $approval->fresh()->status);
        $this->assertEquals('kaprog', $approval->fresh()->approver_role);
    }

    public function test_cannot_approve_already_resolved_via_http(): void
    {
        $approval = $this->pendingApproval();
        $pembimbing = $this->user('pembimbing');

        // Resolve dulu.
        (new ApproveRequest)->handle($approval, $pembimbing, Approval::STATUS_APPROVED);

        // Coba approve lagi — harus 403 karena policy canAct() = false.
        $this->actingAs($pembimbing)
            ->post("/approvals/{$approval->id}/approve")
            ->assertForbidden();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $approval = $this->pendingApproval();

        $this->post("/approvals/{$approval->id}/approve")
            ->assertRedirect('/login');
    }
}
