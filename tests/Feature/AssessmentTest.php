<?php

namespace Tests\Feature;

use App\Models\AspekProduktif;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AssessmentTest extends TestCase
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
     * Skenario: 1 industri dengan guru pembimbing + pembimbing industri, 1 siswa,
     * dan 1 aspek teknis + 1 aspek non-teknis.
     *
     * @return array{teacher: User, pembimbing: User, student: Student, teknis: AspekProduktif, nonTeknis: AspekProduktif, industry: Industry}
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

        $student = Student::factory()->create(['industri_id' => $industry->id]);

        return [
            'teacher' => $teacherUser,
            'pembimbing' => $pembimbingUser,
            'student' => $student,
            'industry' => $industry,
            'teknis' => AspekProduktif::factory()->teknis()->create(['no' => 1]),
            'nonTeknis' => AspekProduktif::factory()->nonTeknis()->create(['no' => 1]),
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/penilaian')->assertRedirect('/login');
    }

    public function test_wakasek_can_view_assessments(): void
    {
        $this->actingAs($this->user('wakasek'))
            ->get('/penilaian')
            ->assertInertia(fn (Assert $page) => $page->component('assessments/index'));
    }

    public function test_admin_can_view_department_layer(): void
    {
        $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get('/penilaian')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('assessments/index')
                ->has('departemens', 1)
            );
    }

    public function test_admin_can_drill_into_classes_and_students(): void
    {
        $s = $this->scenario();
        $student = $s['student'];
        $admin = $this->user('admin');

        $this->actingAs($admin)
            ->get("/penilaian/jurusan/{$student->departemen_id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('assessments/classes')
                ->has('classes', 1)
            );

        $this->actingAs($admin)
            ->get("/penilaian/kelas/{$student->class_id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('assessments/students')
                ->has('students.data', 1)
            );
    }

    public function test_student_is_redirected_to_own_recap(): void
    {
        $siswa = $this->user('siswa');
        $student = Student::factory()->create(['user_id' => $siswa->id]);

        $this->actingAs($siswa)
            ->get('/penilaian')
            ->assertRedirect("/penilaian/{$student->id}");
    }

    public function test_guru_can_score_non_technical_aspects(): void
    {
        $s = $this->scenario();

        $this->actingAs($s['teacher'])
            ->put("/penilaian/{$s['student']->id}", [
                'scores' => [$s['nonTeknis']->id => 85],
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('evaluations', [
            'student_id' => $s['student']->id,
            'aspek_produktif_id' => $s['nonTeknis']->id,
            'score' => 85,
        ]);
    }

    public function test_guru_cannot_score_technical_aspects(): void
    {
        $s = $this->scenario();

        $this->actingAs($s['teacher'])
            ->put("/penilaian/{$s['student']->id}", [
                'scores' => [$s['teknis']->id => 90],
            ])
            ->assertSessionHas('success');

        // Aspek teknis di luar kewenangan guru -> diabaikan.
        $this->assertDatabaseMissing('evaluations', [
            'student_id' => $s['student']->id,
            'aspek_produktif_id' => $s['teknis']->id,
        ]);
    }

    public function test_pembimbing_can_score_technical_aspects(): void
    {
        $s = $this->scenario();

        $this->actingAs($s['pembimbing'])
            ->put("/penilaian/{$s['student']->id}", [
                'scores' => [$s['teknis']->id => 72],
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('evaluations', [
            'student_id' => $s['student']->id,
            'aspek_produktif_id' => $s['teknis']->id,
            'score' => 72,
        ]);
    }

    public function test_empty_score_clears_existing_value(): void
    {
        $s = $this->scenario();

        $this->actingAs($s['teacher'])
            ->put("/penilaian/{$s['student']->id}", [
                'scores' => [$s['nonTeknis']->id => 85],
            ]);

        $this->actingAs($s['teacher'])
            ->put("/penilaian/{$s['student']->id}", [
                'scores' => [$s['nonTeknis']->id => ''],
            ]);

        $this->assertDatabaseMissing('evaluations', [
            'student_id' => $s['student']->id,
            'aspek_produktif_id' => $s['nonTeknis']->id,
        ]);
    }

    public function test_score_must_be_within_range(): void
    {
        $s = $this->scenario();

        $this->actingAs($s['teacher'])
            ->put("/penilaian/{$s['student']->id}", [
                'scores' => [$s['nonTeknis']->id => 150],
            ])
            ->assertSessionHasErrors("scores.{$s['nonTeknis']->id}");
    }

    public function test_guru_cannot_score_student_outside_scope(): void
    {
        $s = $this->scenario();
        $otherStudent = Student::factory()->create([
            'industri_id' => Industry::factory()->create()->id,
        ]);

        $this->actingAs($s['teacher'])
            ->put("/penilaian/{$otherStudent->id}", [
                'scores' => [$s['nonTeknis']->id => 80],
            ])
            ->assertForbidden();
    }

    public function test_admin_cannot_submit_scores(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->put("/penilaian/{$s['student']->id}", [
                'scores' => [$s['nonTeknis']->id => 80],
            ])
            ->assertForbidden();
    }

    public function test_show_exposes_capability_flags_for_guru(): void
    {
        $s = $this->scenario();

        $this->actingAs($s['teacher'])
            ->get("/penilaian/{$s['student']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('assessments/show')
                ->where('can.nonTeknis', true)
                ->where('can.teknis', false)
                ->has('nonTeknis', 1)
                ->has('teknis', 1)
            );
    }
}
