<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentTest extends TestCase
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

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        $departemen = Departemen::factory()->create();

        return [
            'name' => 'Budi Santoso',
            'email' => 'budi@simonik.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nis' => '2024001',
            'placeOfBirth' => 'Bandung',
            'dateOfBirth' => '2008-05-01',
            'gender' => 'L',
            'bloodType' => 'O',
            'alamat' => 'Jl. Mawar No. 1',
            'status_pkl' => 'belum',
            'class_id' => Classes::factory()->create(['departemen_id' => $departemen->id])->id,
            'industri_id' => Industry::factory()->create()->id,
            'departemen_id' => $departemen->id,
            'parent_id' => Parents::factory()->create()->id,
            'teacher_id' => Teacher::factory()->create(['departemen_id' => $departemen->id])->id,
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/students')->assertRedirect('/login');
    }

    public function test_students_without_permission_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/students')->assertForbidden();
    }

    public function test_admin_can_view_student_list(): void
    {
        $this->actingAs($this->admin())->get('/students')->assertOk();
    }

    public function test_admin_can_create_a_student_with_account(): void
    {
        $payload = $this->validPayload();

        $this->actingAs($this->admin())
            ->post('/students', $payload)
            ->assertRedirect(route('students.index'));

        $this->assertDatabaseHas('students', [
            'nis' => '2024001',
            'name' => 'Budi Santoso',
        ]);
        $this->assertDatabaseHas('users', ['email' => 'budi@simonik.test']);

        $user = User::where('email', 'budi@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('siswa'));
    }

    public function test_admin_can_update_a_student(): void
    {
        $student = Student::factory()->create();

        $payload = [
            'name' => 'Nama Baru',
            'email' => 'baru@simonik.test',
            'nis' => $student->nis,
            'placeOfBirth' => $student->placeOfBirth,
            'dateOfBirth' => $student->dateOfBirth->format('Y-m-d'),
            'gender' => 'P',
            'bloodType' => 'A',
            'alamat' => $student->alamat,
            'status_pkl' => 'proses',
            'class_id' => $student->class_id,
            'industri_id' => $student->industri_id,
            'departemen_id' => $student->departemen_id,
            'parent_id' => $student->parent_id,
            'teacher_id' => $student->teacher_id,
        ];

        $this->actingAs($this->admin())
            ->put("/students/{$student->id}", $payload)
            ->assertRedirect(route('students.index'));

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'name' => 'Nama Baru',
            'status_pkl' => 'proses',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $student->user_id,
            'email' => 'baru@simonik.test',
        ]);
    }

    public function test_admin_can_delete_a_student_and_its_account(): void
    {
        $student = Student::factory()->create();
        $userId = $student->user_id;

        $this->actingAs($this->admin())
            ->delete("/students/{$student->id}")
            ->assertRedirect(route('students.index'));

        $this->assertDatabaseMissing('students', ['id' => $student->id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }
}
