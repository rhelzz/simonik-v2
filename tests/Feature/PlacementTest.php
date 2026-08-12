<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PlacementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function kaprogOwning(Departemen $dep): User
    {
        $user = User::factory()->create();
        $user->assignRole('kaprog');
        $dep->update(['user_id' => $user->id]);

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/penempatan')->assertRedirect('/login');
    }

    public function test_siswa_cannot_access_placement(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/penempatan')->assertForbidden();
    }

    public function test_kaprog_only_sees_students_in_their_program(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $mine = Student::factory()->create(['departemen_id' => $dep->id]);
        $other = Student::factory()->create();

        $this->actingAs($kaprog)
            ->get('/penempatan')
            ->assertOk()
            ->assertSee($mine->name, false)
            ->assertDontSee($other->name, false);
    }

    public function test_kaprog_can_place_student_to_industry(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $student = Student::factory()->create([
            'departemen_id' => $dep->id,
            'status_pkl' => 'belum',
        ]);
        $target = Industry::factory()->create();

        $this->actingAs($kaprog)
            ->patch("/penempatan/{$student->id}", [
                'industri_id' => $target->id,
                'status_pkl' => 'proses',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'industri_id' => $target->id,
            'status_pkl' => 'proses',
        ]);
    }

    public function test_kaprog_cannot_place_student_outside_their_program(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $outsider = Student::factory()->create();
        $target = Industry::factory()->create();

        $this->actingAs($kaprog)
            ->patch("/penempatan/{$outsider->id}", [
                'industri_id' => $target->id,
                'status_pkl' => 'proses',
            ])
            ->assertForbidden();
    }

    public function test_admin_sees_all_students(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $student = Student::factory()->create();

        $this->actingAs($admin)
            ->get('/penempatan')
            ->assertOk()
            ->assertSee($student->name, false);
    }

    public function test_flags_industries_missing_guru_pembimbing_only(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('admin');

        $missingGuru = Industry::factory()->create(['teacher_id' => null, 'pembimbing_id' => null]);
        // Pembimbing industri kosong sendirian tidak ditandai — itu wajar,
        // tidak semua industri memakai akun pembimbing.
        Industry::factory()->create([
            'teacher_id' => Teacher::factory(),
            'pembimbing_id' => null,
        ]);

        $this->actingAs($admin)
            ->get('/penempatan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('unassignedIndustries', 1)
                ->where('unassignedIndustries.0.id', $missingGuru->id)
            );
    }

    public function test_filter_by_kelas_hanya_menampilkan_siswa_kelas_tersebut(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $classA = Classes::factory()->create(['departemen_id' => $dep->id]);
        $classB = Classes::factory()->create(['departemen_id' => $dep->id]);

        $inA = Student::factory()->create(['departemen_id' => $dep->id, 'class_id' => $classA->id]);
        $inB = Student::factory()->create(['departemen_id' => $dep->id, 'class_id' => $classB->id]);

        $this->actingAs($kaprog)
            ->get('/penempatan?class_id='.$classA->id)
            ->assertOk()
            ->assertSee($inA->name, false)
            ->assertDontSee($inB->name, false);
    }

    public function test_filter_by_industri_hanya_menampilkan_siswa_industri_tersebut(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $industryX = Industry::factory()->create();
        $industryY = Industry::factory()->create();

        $inX = Student::factory()->create(['departemen_id' => $dep->id, 'industri_id' => $industryX->id]);
        $inY = Student::factory()->create(['departemen_id' => $dep->id, 'industri_id' => $industryY->id]);

        $this->actingAs($kaprog)
            ->get('/penempatan?industri_id='.$industryX->id)
            ->assertOk()
            ->assertSee($inX->name, false)
            ->assertDontSee($inY->name, false);
    }

    public function test_filter_by_guru_pembimbing_menampilkan_siswa_di_industri_guru_tersebut(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $guru1 = Teacher::factory()->create();
        $guru2 = Teacher::factory()->create();
        $industryGuru1 = Industry::factory()->create(['teacher_id' => $guru1->id]);
        $industryGuru2 = Industry::factory()->create(['teacher_id' => $guru2->id]);

        $studentA = Student::factory()->create(['departemen_id' => $dep->id, 'industri_id' => $industryGuru1->id]);
        $studentB = Student::factory()->create(['departemen_id' => $dep->id, 'industri_id' => $industryGuru2->id]);

        $this->actingAs($kaprog)
            ->get('/penempatan?teacher_id='.$guru1->id)
            ->assertOk()
            ->assertSee($studentA->name, false)
            ->assertDontSee($studentB->name, false);
    }

    public function test_filter_by_status_pkl_hanya_menampilkan_status_tersebut(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $belum = Student::factory()->create(['departemen_id' => $dep->id, 'status_pkl' => 'belum']);
        $proses = Student::factory()->create(['departemen_id' => $dep->id, 'status_pkl' => 'proses']);

        $this->actingAs($kaprog)
            ->get('/penempatan?status_pkl=proses')
            ->assertOk()
            ->assertSee($proses->name, false)
            ->assertDontSee($belum->name, false);
    }

    public function test_kombinasi_filter_bekerja_dengan_and_bukan_or(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $classA = Classes::factory()->create(['departemen_id' => $dep->id]);

        $match = Student::factory()->create([
            'departemen_id' => $dep->id,
            'class_id' => $classA->id,
            'status_pkl' => 'proses',
        ]);
        // Kelas sama, tapi status beda — tidak boleh ikut kalau AND benar-benar diterapkan.
        $wrongStatus = Student::factory()->create([
            'departemen_id' => $dep->id,
            'class_id' => $classA->id,
            'status_pkl' => 'belum',
        ]);

        $this->actingAs($kaprog)
            ->get('/penempatan?class_id='.$classA->id.'&status_pkl=proses')
            ->assertOk()
            ->assertSee($match->name, false)
            ->assertDontSee($wrongStatus->name, false);
    }

    public function test_guru_pembimbing_default_ikut_industri(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $guru = Teacher::factory()->create(['name' => 'Pak Industri']);
        $industry = Industry::factory()->create(['teacher_id' => $guru->id]);
        Student::factory()->create(['departemen_id' => $dep->id, 'industri_id' => $industry->id]);

        $this->actingAs($kaprog)
            ->get('/penempatan')
            ->assertOk()
            ->assertSee('Pak Industri', false);
    }

    public function test_guru_pembimbing_bisa_di_override_per_siswa(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $industryGuru = Teacher::factory()->create(['departemen_id' => $dep->id]);
        $overrideGuru = Teacher::factory()->create(['departemen_id' => $dep->id]);
        $industry = Industry::factory()->create(['teacher_id' => $industryGuru->id]);
        $student = Student::factory()->create([
            'departemen_id' => $dep->id,
            'industri_id' => $industry->id,
        ]);

        $this->actingAs($kaprog)
            ->patch("/penempatan/{$student->id}", [
                'industri_id' => $industry->id,
                'status_pkl' => $student->status_pkl,
                'teacher_id' => $overrideGuru->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'teacher_id' => $overrideGuru->id,
        ]);
    }

    public function test_override_bisa_dikembalikan_ke_ikut_industri(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $overrideGuru = Teacher::factory()->create(['departemen_id' => $dep->id]);
        $student = Student::factory()->create([
            'departemen_id' => $dep->id,
            'teacher_id' => $overrideGuru->id,
        ]);

        $this->actingAs($kaprog)
            ->patch("/penempatan/{$student->id}", [
                'industri_id' => $student->industri_id,
                'status_pkl' => $student->status_pkl,
                'teacher_id' => null,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('students', ['id' => $student->id, 'teacher_id' => null]);
    }

    public function test_guru_override_di_luar_jurusan_kaprog_ditolak(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $student = Student::factory()->create(['departemen_id' => $dep->id]);
        $outsideGuru = Teacher::factory()->create(); // jurusan lain

        $this->actingAs($kaprog)
            ->patch("/penempatan/{$student->id}", [
                'industri_id' => $student->industri_id,
                'status_pkl' => $student->status_pkl,
                'teacher_id' => $outsideGuru->id,
            ])
            ->assertForbidden();
    }

    public function test_guru_dengan_override_bisa_lihat_siswa_meski_beda_industri(): void
    {
        $guruUser = User::factory()->create();
        $guruUser->assignRole('guru');
        $overrideGuru = Teacher::factory()->create(['user_id' => $guruUser->id]);

        $otherTeacher = Teacher::factory()->create();
        $industry = Industry::factory()->create(['teacher_id' => $otherTeacher->id]);
        $student = Student::factory()->create([
            'industri_id' => $industry->id,
            'teacher_id' => $overrideGuru->id,
        ]);

        $this->actingAs($guruUser)
            ->get("/monitoring/absen/murid/{$student->id}")
            ->assertOk();
    }

    public function test_guru_industri_asli_kehilangan_akses_setelah_siswa_di_override(): void
    {
        $originalGuruUser = User::factory()->create();
        $originalGuruUser->assignRole('guru');
        $originalGuru = Teacher::factory()->create(['user_id' => $originalGuruUser->id]);

        $overrideGuru = Teacher::factory()->create();
        $industry = Industry::factory()->create(['teacher_id' => $originalGuru->id]);
        $student = Student::factory()->create([
            'industri_id' => $industry->id,
            'teacher_id' => $overrideGuru->id,
        ]);

        $this->actingAs($originalGuruUser)
            ->get("/monitoring/absen/murid/{$student->id}")
            ->assertForbidden();
    }

    public function test_opsi_kelas_dibatasi_lingkup_kaprog(): void
    {
        $dep = Departemen::factory()->create();
        $kaprog = $this->kaprogOwning($dep);

        $ownClass = Classes::factory()->create(['departemen_id' => $dep->id]);
        $otherClass = Classes::factory()->create();

        $this->actingAs($kaprog)
            ->get('/penempatan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('classOptions', 1)
                ->where('classOptions.0.id', $ownClass->id)
            );

        $this->assertNotEquals($ownClass->departemen_id, $otherClass->departemen_id);
    }
}
