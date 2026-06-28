<?php

namespace Tests\Feature;

use App\Models\Departemen;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeacherTest extends TestCase
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
        return [
            'name' => 'Pak Hadi',
            'email' => 'hadi@simonik.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'no_hp' => '081234567890',
            'departemen_id' => Departemen::factory()->create()->id,
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/teachers')->assertRedirect('/login');
    }

    public function test_users_without_permission_are_forbidden(): void
    {
        $guru = User::factory()->create();
        $guru->assignRole('guru');

        $this->actingAs($guru)->get('/teachers')->assertForbidden();
    }

    public function test_admin_can_view_teacher_list(): void
    {
        $this->actingAs($this->admin())->get('/teachers')->assertOk();
    }

    public function test_admin_can_create_a_teacher_with_account(): void
    {
        $this->actingAs($this->admin())
            ->post('/teachers', $this->validPayload())
            ->assertRedirect();

        $this->assertDatabaseHas('teachers', ['name' => 'Pak Hadi']);
        $this->assertDatabaseHas('users', ['email' => 'hadi@simonik.test']);

        $user = User::where('email', 'hadi@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('guru'));
    }

    public function test_admin_can_update_a_teacher(): void
    {
        $teacher = Teacher::factory()->create();

        $payload = [
            'name' => 'Nama Baru',
            'email' => 'baru@simonik.test',
            'no_hp' => '089999999999',
            'departemen_id' => $teacher->departemen_id,
        ];

        $this->actingAs($this->admin())
            ->put("/teachers/{$teacher->id}", $payload)
            ->assertRedirect();

        $this->assertDatabaseHas('teachers', [
            'id' => $teacher->id,
            'name' => 'Nama Baru',
            'no_hp' => '089999999999',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $teacher->user_id,
            'email' => 'baru@simonik.test',
        ]);
    }

    public function test_admin_can_delete_a_teacher_and_its_account(): void
    {
        $teacher = Teacher::factory()->create();
        $userId = $teacher->user_id;

        $this->actingAs($this->admin())
            ->delete("/teachers/{$teacher->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('teachers', ['id' => $teacher->id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_teacher_with_students_cannot_be_deleted(): void
    {
        $teacher = Teacher::factory()->create();
        Student::factory()->create(['teacher_id' => $teacher->id]);

        $this->actingAs($this->admin())
            ->delete("/teachers/{$teacher->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('teachers', ['id' => $teacher->id]);
    }
}
