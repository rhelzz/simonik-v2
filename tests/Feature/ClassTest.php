<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClassTest extends TestCase
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
        $this->get('/classes')->assertRedirect('/login');
    }

    public function test_admin_can_view_list(): void
    {
        $this->actingAs($this->admin())->get('/classes')->assertOk();
    }

    public function test_admin_can_create_a_class(): void
    {
        $departemen = Departemen::factory()->create();

        $this->actingAs($this->admin())->post('/classes', [
            'name' => 'XII RPL A',
            'departemen_id' => $departemen->id,
        ]);

        $this->assertDatabaseHas('classes', [
            'name' => 'XII RPL A',
            'slug' => 'xii-rpl-a',
            'departemen_id' => $departemen->id,
        ]);
    }

    public function test_departemen_is_required(): void
    {
        $this->actingAs($this->admin())
            ->post('/classes', ['name' => 'Tanpa Jurusan'])
            ->assertSessionHasErrors('departemen_id');
    }

    public function test_admin_can_update_a_class(): void
    {
        $class = Classes::factory()->create();

        $this->actingAs($this->admin())->put("/classes/{$class->id}", [
            'name' => 'Kelas Baru',
            'departemen_id' => $class->departemen_id,
        ]);

        $this->assertDatabaseHas('classes', [
            'id' => $class->id,
            'name' => 'Kelas Baru',
            'slug' => 'kelas-baru',
        ]);
    }

    public function test_class_with_students_cannot_be_deleted(): void
    {
        $class = Classes::factory()->create();
        Student::factory()->create(['class_id' => $class->id]);

        $this->actingAs($this->admin())
            ->delete("/classes/{$class->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('classes', ['id' => $class->id]);
    }

    public function test_empty_class_can_be_deleted(): void
    {
        $class = Classes::factory()->create();

        $this->actingAs($this->admin())
            ->delete("/classes/{$class->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('classes', ['id' => $class->id]);
    }
}
