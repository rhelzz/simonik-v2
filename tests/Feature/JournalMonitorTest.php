<?php

namespace Tests\Feature;

use App\Models\Activity;
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

class JournalMonitorTest extends TestCase
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
     * 1 jurnal belum terverifikasi.
     *
     * @return array{teacher: User, pembimbing: User, student: Student, departemen: Departemen, class: Classes, activity: Activity}
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

        $activity = Activity::factory()->create([
            'user_id' => $studentUser->id,
            'verified' => '0',
        ]);

        return [
            'teacher' => $teacherUser,
            'pembimbing' => $pembimbingUser,
            'student' => $student,
            'departemen' => $departemen,
            'class' => $class,
            'activity' => $activity,
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/monitoring/jurnal')->assertRedirect('/login');
    }

    public function test_wakasek_can_view_monitor(): void
    {
        $this->actingAs($this->user('wakasek'))
            ->get('/monitoring/jurnal')
            ->assertInertia(fn (Assert $page) => $page->component('journal-monitor/index'));
    }

    public function test_siswa_cannot_access_monitor(): void
    {
        $this->actingAs($this->user('siswa'))
            ->get('/monitoring/jurnal')
            ->assertForbidden();
    }

    public function test_admin_sees_departemens_layer(): void
    {
        $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/jurnal')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('journal-monitor/index')
                ->has('departemens', 1)
                ->where('departemens.0.students', 1)
            );
    }

    public function test_classes_layer_renders_empty_state_for_empty_departemen(): void
    {
        $this->scenario();
        $empty = Departemen::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/jurnal/jurusan/{$empty->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('journal-monitor/classes')
                ->has('classes', 0)
            );
    }

    public function test_students_layer_lists_students(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/jurnal/kelas/{$s['class']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('journal-monitor/students')
                ->has('students.data', 1)
                ->where('students.data.0.total', 1)
            );
    }

    public function test_show_layer_lists_records(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/jurnal/murid/{$s['student']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('journal-monitor/show')
                ->has('records.data', 1)
                ->where('performance.journal.total', 1)
                ->has('performance.journalRate')
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
            ->get("/monitoring/jurnal/murid/{$other->id}")
            ->assertForbidden();
    }

    public function test_reviewer_can_toggle_journal_status_and_rate_waits_for_all(): void
    {
        $s = $this->scenario();

        $this->actingAs($s['teacher'])
            ->patch("/monitoring/jurnal/{$s['activity']->id}/verified", ['verified' => true])
            ->assertRedirect();

        $this->assertDatabaseHas('activities', ['id' => $s['activity']->id, 'verified' => '1']);

        $this->actingAs($s['teacher'])
            ->get("/monitoring/jurnal/murid/{$s['student']->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->where('records.data.0.verified', true)
                ->where('performance.journalRate', 100));

        $new = Activity::factory()->create(['user_id' => $s['student']->user_id, 'verified' => null]);
        $this->actingAs($s['teacher'])
            ->get("/monitoring/jurnal/murid/{$s['student']->id}")
            ->assertInertia(fn (Assert $page) => $page->where('performance.journalRate', null));

        $this->assertNotNull($new->id);
    }

    public function test_reviewer_cannot_verify_journal_outside_scope(): void
    {
        $s = $this->scenario();
        $other = Activity::factory()->create();

        $this->actingAs($s['teacher'])
            ->patch("/monitoring/jurnal/{$other->id}/verified", ['verified' => true])
            ->assertForbidden();
    }
}
