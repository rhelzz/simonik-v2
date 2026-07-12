<?php

namespace Tests\Feature;

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
            ->assertSee($mine->name)
            ->assertDontSee($other->name);
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
            ->assertSee($student->name);
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
}
