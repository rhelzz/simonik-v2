<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Student;
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
        $user = User::factory()->create();
        $user->assignRole('admin');

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
}
