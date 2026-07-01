<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PartnershipTest extends TestCase
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
        $this->get('/kemitraan')->assertRedirect('/login');
    }

    public function test_disallowed_role_is_forbidden(): void
    {
        $this->actingAs($this->user('siswa'))
            ->get('/kemitraan')
            ->assertForbidden();
    }

    public function test_admin_and_wakasek_can_view(): void
    {
        Industry::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get('/kemitraan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('partnerships/index')
                ->has('partners.data', 1)
            );

        $this->actingAs($this->user('wakasek'))
            ->get('/kemitraan')
            ->assertOk();
    }

    public function test_over_capacity_is_flagged(): void
    {
        $industry = Industry::factory()->create(['kuota' => 1]);
        Student::factory()->count(2)->create(['industri_id' => $industry->id]);

        $this->actingAs($this->user('wakasek'))
            ->get('/kemitraan')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('partners.data.0.placed', 2)
                ->where('partners.data.0.kuota', 1)
                ->where('partners.data.0.remaining', 0)
                ->where('partners.data.0.over', true)
                ->where('summary.overCapacity', 1)
            );
    }

    public function test_wakasek_can_update_kuota(): void
    {
        $industry = Industry::factory()->create(['kuota' => null]);

        $this->actingAs($this->user('wakasek'))
            ->patch("/kemitraan/{$industry->id}/kuota", ['kuota' => 5])
            ->assertRedirect();

        $this->assertDatabaseHas('industries', ['id' => $industry->id, 'kuota' => 5]);
    }

    public function test_kuota_can_be_cleared_to_unlimited(): void
    {
        $industry = Industry::factory()->create(['kuota' => 3]);

        $this->actingAs($this->user('wakasek'))
            ->patch("/kemitraan/{$industry->id}/kuota", ['kuota' => null])
            ->assertRedirect();

        $this->assertDatabaseHas('industries', ['id' => $industry->id, 'kuota' => null]);
    }
}
