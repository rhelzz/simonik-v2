<?php

namespace Tests\Feature;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DepartemenTest extends TestCase
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
        $this->get('/departemens')->assertRedirect('/login');
    }

    public function test_users_without_permission_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/departemens')->assertForbidden();
    }

    public function test_admin_can_view_list(): void
    {
        $this->actingAs($this->admin())->get('/departemens')->assertOk();
    }

    public function test_admin_can_create_a_departemen_with_slug(): void
    {
        $this->actingAs($this->admin())
            ->post('/departemens', ['name' => 'Rekayasa Perangkat Lunak']);

        $this->assertDatabaseHas('departemens', [
            'name' => 'Rekayasa Perangkat Lunak',
            'slug' => 'rekayasa-perangkat-lunak',
        ]);
    }

    public function test_name_must_be_unique(): void
    {
        Departemen::factory()->create(['name' => 'Multimedia']);

        $this->actingAs($this->admin())
            ->post('/departemens', ['name' => 'Multimedia'])
            ->assertSessionHasErrors('name');
    }

    public function test_admin_can_update_a_departemen(): void
    {
        $departemen = Departemen::factory()->create();

        $this->actingAs($this->admin())
            ->put("/departemens/{$departemen->id}", ['name' => 'Nama Baru']);

        $this->assertDatabaseHas('departemens', [
            'id' => $departemen->id,
            'name' => 'Nama Baru',
            'slug' => 'nama-baru',
        ]);
    }

    public function test_departemen_with_classes_cannot_be_deleted(): void
    {
        $departemen = Departemen::factory()->create();
        Classes::factory()->create(['departemen_id' => $departemen->id]);

        $this->actingAs($this->admin())
            ->delete("/departemens/{$departemen->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('departemens', ['id' => $departemen->id]);
    }

    public function test_empty_departemen_can_be_deleted(): void
    {
        $departemen = Departemen::factory()->create();

        $this->actingAs($this->admin())
            ->delete("/departemens/{$departemen->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('departemens', ['id' => $departemen->id]);
    }
}
