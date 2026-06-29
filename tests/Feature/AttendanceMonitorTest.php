<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Departemen;
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

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    /**
     * 1 industri (guru + pembimbing), 1 siswa di jurusan+kelas tertentu, dengan
     * 1 catatan absen belum terverifikasi.
     *
     * @return array{teacher: User, pembimbing: User, student: Student, departemen: Departemen, class: Classes, attendance: Attendance}
     */
    private function scenario(): array
    {
        $teacherUser = $this->user('guru');
        $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);

        $pembimbingUser = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);

        $industry = Industry::factory()->create([
            'teacher_id' => $teacher->id,
            'pembimbing_id' => $pembimbing->id,
        ]);

        $departemen = Departemen::factory()->create();
        $class = Classes::factory()->create(['departemen_id' => $departemen->id]);

        $studentUser = $this->user('siswa');
        $student = Student::factory()->create([
            'user_id' => $studentUser->id,
            'industri_id' => $industry->id,
            'departemen_id' => $departemen->id,
            'class_id' => $class->id,
        ]);

        $attendance = Attendance::factory()->create([
            'user_id' => $studentUser->id,
            'status' => 'hadir',
            'verified' => '0',
        ]);

        return [
            'teacher' => $teacherUser,
            'pembimbing' => $pembimbingUser,
            'student' => $student,
            'departemen' => $departemen,
            'class' => $class,
            'attendance' => $attendance,
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/monitoring/absen')->assertRedirect('/login');
    }

    public function test_roles_outside_scope_are_forbidden(): void
    {
        $this->actingAs($this->user('kepala_sekolah'))
            ->get('/monitoring/absen')
            ->assertForbidden();
    }

    public function test_siswa_cannot_access_monitor(): void
    {
        $this->actingAs($this->user('siswa'))
            ->get('/monitoring/absen')
            ->assertForbidden();
    }

    public function test_admin_sees_departemens_layer(): void
    {
        $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/index')
                ->has('departemens', 1)
                ->where('departemens.0.students', 1)
            );
    }

    public function test_classes_layer_lists_classes_with_students(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/jurusan/{$s['departemen']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/classes')
                ->has('classes', 1)
                ->where('classes.0.id', $s['class']->id)
            );
    }

    public function test_classes_layer_forbidden_for_empty_departemen(): void
    {
        $this->scenario();
        $empty = Departemen::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/jurusan/{$empty->id}")
            ->assertForbidden();
    }

    public function test_students_layer_lists_students(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/kelas/{$s['class']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/students')
                ->has('students.data', 1)
                ->where('students.data.0.total', 1)
            );
    }

    public function test_show_layer_lists_records(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/murid/{$s['student']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/show')
                ->has('records.data', 1)
                ->where('performance.attendance.hadir', 1)
                ->has('performance.attendanceRate')
            );
    }

    public function test_guru_cannot_view_student_outside_scope(): void
    {
        $this->scenario();
        $guru = $this->user('guru');
        Teacher::factory()->create(['user_id' => $guru->id]);

        $other = Student::factory()->create([
            'industri_id' => Industry::factory()->create()->id,
        ]);

        $this->actingAs($guru)
            ->get("/monitoring/absen/murid/{$other->id}")
            ->assertForbidden();
    }
}
