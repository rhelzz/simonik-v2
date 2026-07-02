<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WakasekTest extends TestCase
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

    private function wakasek(): User
    {
        $user = User::factory()->create();
        $user->assignRole('wakasek');

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        return [
            'name' => 'Bu Rina',
            'email' => 'rina@simonik.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/wakaseks')->assertRedirect('/login');
    }

    public function test_kaprog_cannot_manage_wakaseks(): void
    {
        $kaprog = User::factory()->create();
        $kaprog->assignRole('kaprog');

        $this->actingAs($kaprog)->get('/wakaseks')->assertForbidden();
    }

    public function test_admin_can_view_wakasek_list(): void
    {
        $this->actingAs($this->admin())->get('/wakaseks')->assertOk();
    }

    public function test_admin_can_create_a_wakasek_account(): void
    {
        $this->actingAs($this->admin())
            ->post('/wakaseks', $this->validPayload())
            ->assertRedirect();

        $user = User::where('email', 'rina@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('wakasek'));
    }

    public function test_admin_can_update_a_wakasek_without_changing_password(): void
    {
        $wakasek = $this->wakasek();

        $this->actingAs($this->admin())
            ->put("/wakaseks/{$wakasek->id}", [
                'name' => 'Nama Baru',
                'email' => 'barubu@simonik.test',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $wakasek->id,
            'name' => 'Nama Baru',
            'email' => 'barubu@simonik.test',
        ]);
    }

    public function test_admin_can_delete_a_wakasek(): void
    {
        $wakasek = $this->wakasek();

        $this->actingAs($this->admin())
            ->delete("/wakaseks/{$wakasek->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('users', ['id' => $wakasek->id]);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->admin();
        $admin->assignRole('wakasek');

        $this->actingAs($admin)
            ->delete("/wakaseks/{$admin->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_editing_a_non_wakasek_user_returns_404(): void
    {
        $guru = User::factory()->create();
        $guru->assignRole('guru');

        $this->actingAs($this->admin())
            ->get("/wakaseks/{$guru->id}/edit")
            ->assertNotFound();
    }
}
