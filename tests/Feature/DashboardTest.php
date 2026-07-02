<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        return $this->user('admin');
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_admin_sees_summary_counts(): void
    {
        Student::factory()->count(2)->create(['status_pkl' => 'proses']);
        Student::factory()->create(['status_pkl' => 'belum']);

        $this->actingAs($this->admin())
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('stats.students', 3)
                ->where('stats.activePkl', 2)
                ->has('attendanceRate.today')
                ->has('journalRate.today')
            );
    }

    public function test_attendance_rate_today_reflects_present_active_students(): void
    {
        $present = Student::factory()->create(['status_pkl' => 'proses']);
        Student::factory()->create(['status_pkl' => 'proses']);

        Attendance::factory()->create([
            'user_id' => $present->user_id,
            'date' => Carbon::now()->toDateString(),
            'status' => 'hadir',
        ]);

        // 1 dari 2 siswa aktif hadir hari ini = 50%.
        $this->actingAs($this->admin())
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('attendanceRate.today', 50)
            );
    }

    public function test_wakasek_sees_wakasek_dashboard(): void
    {
        $this->actingAs($this->user('wakasek'))
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard-wakasek')
                ->has('stats.students')
                ->has('stats.activePkl')
                ->has('stats.industries')
                ->has('stats.teachers')
                ->has('finance.balance')
                ->has('finance.receipts')
                ->has('finance.expenses')
                ->has('capacity.quota')
                ->has('capacity.utilization')
                ->has('attendanceRate.month')
                ->has('journalRate.month')
                ->has('byDepartment')
            );
    }

    public function test_kaprog_sees_scoped_program_dashboard(): void
    {
        $kaprogUser = $this->user('kaprog');
        $dep = Departemen::factory()->create(['user_id' => $kaprogUser->id]);
        Student::factory()->count(2)->create(['departemen_id' => $dep->id]);
        // Siswa di jurusan lain tidak dihitung.
        Student::factory()->create();

        $this->actingAs($kaprogUser)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard-kaprog')
                ->where('stats.departemens', 1)
                ->where('stats.students', 2)
                ->has('attendanceRate.month')
                ->has('journalRate.month')
                ->has('departemens')
            );
    }

    public function test_guru_sees_scoped_staff_dashboard(): void
    {
        $guruUser = $this->user('guru');
        $teacher = Teacher::factory()->create(['user_id' => $guruUser->id]);
        $industry = Industry::factory()->create(['teacher_id' => $teacher->id]);
        Student::factory()->create(['industri_id' => $industry->id]);
        // Siswa di PT lain tidak masuk cakupan guru ini.
        Student::factory()->create();

        $this->actingAs($guruUser)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard-staff')
                ->where('stats.students', 1)
                ->has('attendanceRate.today')
            );
    }

    public function test_student_sees_personal_dashboard(): void
    {
        $siswa = $this->user('siswa');
        Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard-student')
                ->has('stats.journalTotal')
                ->has('todayStatus')
            );
    }

    public function test_orangtua_sees_children_dashboard(): void
    {
        $ortuUser = $this->user('orangtua');
        $parent = Parents::factory()->create(['user_id' => $ortuUser->id]);
        Student::factory()->count(2)->create(['parent_id' => $parent->id]);
        Student::factory()->create();

        $this->actingAs($ortuUser)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard-parent')
                ->has('children', 2)
            );
    }
}
