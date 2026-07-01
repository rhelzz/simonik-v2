<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\AspekProduktif;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\SidangAspect;
use App\Models\SidangResult;
use App\Models\SidangScore;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RaporTest extends TestCase
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

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/rapor')->assertRedirect('/login');
    }

    public function test_disallowed_role_is_forbidden(): void
    {
        $this->actingAs($this->user('guru'))
            ->get('/rapor')
            ->assertForbidden();
    }

    public function test_student_is_redirected_to_own_rapor(): void
    {
        $siswa = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->get('/rapor')
            ->assertRedirect("/rapor/{$student->id}");
    }

    public function test_admin_can_view_student_list(): void
    {
        Student::factory()->create(['archived' => false]);

        $this->actingAs($this->user('admin'))
            ->get('/rapor')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('rapor/index')
                ->has('students.data', 1)
            );
    }

    public function test_student_cannot_view_other_students_rapor(): void
    {
        $other = Student::factory()->create();

        $this->actingAs($this->user('siswa'))
            ->get("/rapor/{$other->id}")
            ->assertForbidden();
    }

    public function test_rapor_compiles_scores_attendance_and_qr(): void
    {
        $student = Student::factory()->create(['status_pkl' => 'selesai']);

        // Aspek + nilai: teknis (80, 90 -> avg 85), non-teknis (70 -> 70).
        $t1 = AspekProduktif::factory()->create(['category' => 'teknis', 'no' => 1]);
        $t2 = AspekProduktif::factory()->create(['category' => 'teknis', 'no' => 2]);
        $n1 = AspekProduktif::factory()->create(['category' => 'non_teknis', 'no' => 1]);
        Evaluation::factory()->create(['student_id' => $student->id, 'aspek_produktif_id' => $t1->id, 'score' => 80]);
        Evaluation::factory()->create(['student_id' => $student->id, 'aspek_produktif_id' => $t2->id, 'score' => 90]);
        Evaluation::factory()->create(['student_id' => $student->id, 'aspek_produktif_id' => $n1->id, 'score' => 70]);

        // Sidang: satu aspek nilai 100.
        $sa = SidangAspect::factory()->create(['nama_aspek' => 'Presentasi']);
        SidangScore::factory()->create(['student_id' => $student->id, 'sidang_aspect_id' => $sa->id, 'nilai' => 100]);
        SidangResult::factory()->create(['student_id' => $student->id, 'penguji_1' => 'Pak Guru', 'status' => 'dinilai']);

        // Kehadiran: 3 hadir, 1 izin. Jurnal: 2.
        foreach (range(1, 3) as $i) {
            Attendance::factory()->create([
                'user_id' => $student->user_id,
                'status' => 'hadir',
                'date' => '2026-06-0'.$i,
            ]);
        }
        Attendance::factory()->create(['user_id' => $student->user_id, 'status' => 'izin', 'date' => '2026-06-04']);
        Activity::factory()->count(2)->create(['user_id' => $student->user_id]);

        $this->actingAs($this->user('admin'))
            ->get("/rapor/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('rapor/show')
                ->has('teknis', 2)
                ->has('nonTeknis', 1)
                ->where('summary.teknis', 85)
                ->where('summary.nonTeknis', 70)
                ->where('summary.sidang', 100)
                // Nilai akhir = rata-rata komponen (85 + 70 + 100) / 3 = 85.
                ->where('summary.final', 85)
                ->where('attendance.hadir', 3)
                ->where('attendance.izin', 1)
                ->where('attendance.total', 4)
                ->where('journalTotal', 2)
                ->has('sidang.scores', 1)
                ->has('qr')
            );
    }

    public function test_student_can_view_own_rapor(): void
    {
        $siswa = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->get("/rapor/{$student->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('rapor/show'));
    }
}
