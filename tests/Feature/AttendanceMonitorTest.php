<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttendanceMonitorTest extends TestCase
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
        $this->get('/absensi')->assertRedirect('/login');
    }

    public function test_students_cannot_access_monitoring(): void
    {
        $this->actingAs($this->studentUser())->get('/absensi')->assertForbidden();
    }

    public function test_admin_sees_all_attendances(): void
    {
        Attendance::factory()->count(3)->create();
        $admin = $this->userWithRole('admin');

        $this->actingAs($admin)
            ->get('/absensi')
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/index')
                ->has('attendances.data', 3)
            );
    }

    public function test_guru_only_sees_their_students_attendances(): void
    {
        $guru = $this->userWithRole('guru');
        $teacher = Teacher::factory()->create(['user_id' => $guru->id]);

        $mine = $this->studentUser();
        Student::factory()->create(['user_id' => $mine->id, 'teacher_id' => $teacher->id]);
        Attendance::factory()->create(['user_id' => $mine->id]);

        $otherStudent = Student::factory()->create();
        Attendance::factory()->create(['user_id' => $otherStudent->user_id]);

        $this->actingAs($guru)
            ->get('/absensi')
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/index')
                ->has('attendances.data', 1)
            );
    }

    public function test_pembimbing_can_verify_attendance_of_their_industry_student(): void
    {
        $pembimbingUser = $this->userWithRole('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);
        $industry = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        $student = $this->studentUser();
        Student::factory()->create(['user_id' => $student->id, 'industri_id' => $industry->id]);
        $attendance = Attendance::factory()->create(['user_id' => $student->id, 'verified' => '0']);

        $this->actingAs($pembimbingUser)
            ->patch("/absensi/{$attendance->id}/verify", ['verified' => true])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', ['id' => $attendance->id, 'verified' => '1']);
    }

    public function test_admin_cannot_verify(): void
    {
        $admin = $this->userWithRole('admin');
        $attendance = Attendance::factory()->create();

        $this->actingAs($admin)
            ->patch("/absensi/{$attendance->id}/verify", ['verified' => true])
            ->assertForbidden();
    }

    public function test_pembimbing_cannot_verify_out_of_scope_attendance(): void
    {
        $pembimbingUser = $this->userWithRole('pembimbing');
        Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);

        $attendance = Attendance::factory()->create();

        $this->actingAs($pembimbingUser)
            ->patch("/absensi/{$attendance->id}/verify", ['verified' => true])
            ->assertForbidden();

        $this->assertDatabaseHas('attendances', ['id' => $attendance->id, 'verified' => $attendance->verified]);
    }
}
