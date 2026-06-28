<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ActivityMonitorTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    private function studentUser(): User
    {
        return $this->userWithRole('siswa');
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/kegiatan')->assertRedirect('/login');
    }

    public function test_students_cannot_access_monitoring(): void
    {
        $this->actingAs($this->studentUser())->get('/kegiatan')->assertForbidden();
    }

    public function test_admin_sees_all_journals(): void
    {
        Activity::factory()->count(3)->create();
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get('/kegiatan')
            ->assertInertia(fn (Assert $page) => $page
                ->component('activity-monitor/index')
                ->has('activities.data', 3)
            );
    }

    public function test_guru_only_sees_their_students_journals(): void
    {
        $guru = $this->userWithRole('guru');
        $teacher = Teacher::factory()->create(['user_id' => $guru->id]);

        $mine = $this->studentUser();
        Student::factory()->create(['user_id' => $mine->id, 'teacher_id' => $teacher->id]);
        Activity::factory()->create(['user_id' => $mine->id]);

        // Jurnal siswa guru lain — tidak boleh muncul.
        $otherStudent = Student::factory()->create();
        Activity::factory()->create(['user_id' => $otherStudent->user_id]);

        $this->actingAs($guru)
            ->get('/kegiatan')
            ->assertInertia(fn (Assert $page) => $page
                ->component('activity-monitor/index')
                ->has('activities.data', 1)
            );
    }

    public function test_pembimbing_can_verify_journal_of_their_industry_student(): void
    {
        $pembimbingUser = $this->userWithRole('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);
        $industry = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        $student = $this->studentUser();
        Student::factory()->create(['user_id' => $student->id, 'industri_id' => $industry->id]);
        $activity = Activity::factory()->create(['user_id' => $student->id, 'verified' => '0']);

        $this->actingAs($pembimbingUser)
            ->patch("/kegiatan/{$activity->id}/verify", ['verified' => true])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('activities', ['id' => $activity->id, 'verified' => '1']);
    }

    public function test_admin_cannot_verify(): void
    {
        $admin = $this->userWithRole('admin');
        $activity = Activity::factory()->create();

        $this->actingAs($admin)
            ->patch("/kegiatan/{$activity->id}/verify", ['verified' => true])
            ->assertForbidden();
    }

    public function test_pembimbing_cannot_verify_out_of_scope_journal(): void
    {
        $pembimbingUser = $this->userWithRole('pembimbing');
        Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);

        // Jurnal siswa yang tidak terkait pembimbing ini.
        $activity = Activity::factory()->create();

        $this->actingAs($pembimbingUser)
            ->patch("/kegiatan/{$activity->id}/verify", ['verified' => true])
            ->assertForbidden();

        $this->assertDatabaseHas('activities', ['id' => $activity->id, 'verified' => $activity->verified]);
    }
}
