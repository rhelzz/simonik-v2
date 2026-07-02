<?php

namespace Tests\Feature;

use App\Models\Departemen;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KaprogTest extends TestCase
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

    private function kaprog(): User
    {
        $user = User::factory()->create();
        $user->assignRole('kaprog');

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/kaprogs')->assertRedirect('/login');
    }

    public function test_kaprog_cannot_manage_other_kaprogs(): void
    {
        $this->actingAs($this->kaprog())->get('/kaprogs')->assertForbidden();
    }

    public function test_admin_can_view_kaprog_list(): void
    {
        $this->actingAs($this->admin())->get('/kaprogs')->assertOk();
    }

    public function test_admin_can_create_a_kaprog_with_departments(): void
    {
        $dep = Departemen::factory()->create(['user_id' => null]);

        $this->actingAs($this->admin())
            ->post('/kaprogs', [
                'name' => 'Pak Budi',
                'email' => 'budi@simonik.test',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'departemen_ids' => [$dep->id],
            ])
            ->assertRedirect();

        $user = User::where('email', 'budi@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('kaprog'));
        $this->assertDatabaseHas('departemens', [
            'id' => $dep->id,
            'user_id' => $user->id,
        ]);
    }

    public function test_update_syncs_department_ownership(): void
    {
        $kaprog = $this->kaprog();
        $owned = Departemen::factory()->create(['user_id' => $kaprog->id]);
        $newDep = Departemen::factory()->create(['user_id' => null]);

        $this->actingAs($this->admin())
            ->put("/kaprogs/{$kaprog->id}", [
                'name' => $kaprog->name,
                'email' => $kaprog->email,
                'departemen_ids' => [$newDep->id],
            ])
            ->assertRedirect();

        // Yang lama dilepas, yang baru diklaim.
        $this->assertDatabaseHas('departemens', ['id' => $owned->id, 'user_id' => null]);
        $this->assertDatabaseHas('departemens', ['id' => $newDep->id, 'user_id' => $kaprog->id]);
    }

    public function test_deleting_a_kaprog_detaches_departments_without_deleting_them(): void
    {
        $kaprog = $this->kaprog();
        $dep = Departemen::factory()->create(['user_id' => $kaprog->id]);

        $this->actingAs($this->admin())
            ->delete("/kaprogs/{$kaprog->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $kaprog->id]);
        // Jurusan TIDAK ikut terhapus, hanya kepemilikan dilepas.
        $this->assertDatabaseHas('departemens', ['id' => $dep->id, 'user_id' => null]);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->admin();
        $admin->assignRole('kaprog');

        $this->actingAs($admin)
            ->delete("/kaprogs/{$admin->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_editing_a_non_kaprog_user_returns_404(): void
    {
        $guru = User::factory()->create();
        $guru->assignRole('guru');

        $this->actingAs($this->admin())
            ->get("/kaprogs/{$guru->id}/edit")
            ->assertNotFound();
    }
}
