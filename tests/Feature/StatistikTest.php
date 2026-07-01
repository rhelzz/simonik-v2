<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StatistikTest extends TestCase
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
        $this->get('/statistik')->assertRedirect('/login');
    }

    public function test_disallowed_role_is_forbidden(): void
    {
        $this->actingAs($this->user('guru'))
            ->get('/statistik')
            ->assertForbidden();
    }

    public function test_wakasek_sees_per_department_and_teacher_stats(): void
    {
        $dep = Departemen::factory()->create(['name' => 'Rekayasa Perangkat Lunak']);
        // Pin kelas ke jurusan ini agar factory tak membuat jurusan tambahan.
        $class = Classes::factory()->create(['departemen_id' => $dep->id]);
        Student::factory()->count(2)->create([
            'departemen_id' => $dep->id,
            'class_id' => $class->id,
            'archived' => false,
        ]);
        Teacher::factory()->create(['departemen_id' => $dep->id]);

        $this->actingAs($this->user('wakasek'))
            ->get('/statistik')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('statistik/index')
                ->where('totals.departments', 1)
                ->where('totals.students', 2)
                ->has('byDepartment', 1)
                ->where('byDepartment.0.name', 'Rekayasa Perangkat Lunak')
                ->where('byDepartment.0.students', 2)
                ->has('teachers', 1)
            );
    }
}
