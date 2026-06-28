<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PembimbingTest extends TestCase
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
            'name' => 'Bu Sari',
            'email' => 'sari@simonik.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'no_hp' => '081234567890',
            'gender' => 'P',
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/pembimbings')->assertRedirect('/login');
    }

    public function test_users_without_permission_are_forbidden(): void
    {
        $pembimbing = User::factory()->create();
        $pembimbing->assignRole('pembimbing');

        $this->actingAs($pembimbing)->get('/pembimbings')->assertForbidden();
    }

    public function test_admin_can_view_pembimbing_list(): void
    {
        $this->actingAs($this->admin())->get('/pembimbings')->assertOk();
    }

    public function test_admin_can_create_a_pembimbing_with_account(): void
    {
        $this->actingAs($this->admin())
            ->post('/pembimbings', $this->validPayload())
            ->assertRedirect();

        $this->assertDatabaseHas('pembimbings', ['name' => 'Bu Sari', 'gender' => 'P']);
        $this->assertDatabaseHas('users', ['email' => 'sari@simonik.test']);

        $user = User::where('email', 'sari@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('pembimbing'));
    }

    public function test_admin_can_update_a_pembimbing(): void
    {
        $pembimbing = Pembimbing::factory()->create();

        $payload = [
            'name' => 'Nama Baru',
            'email' => 'baru@simonik.test',
            'no_hp' => '089999999999',
            'gender' => 'L',
        ];

        $this->actingAs($this->admin())
            ->put("/pembimbings/{$pembimbing->id}", $payload)
            ->assertRedirect();

        $this->assertDatabaseHas('pembimbings', [
            'id' => $pembimbing->id,
            'name' => 'Nama Baru',
            'gender' => 'L',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $pembimbing->user_id,
            'email' => 'baru@simonik.test',
        ]);
    }

    public function test_admin_can_delete_a_pembimbing_and_its_account(): void
    {
        $pembimbing = Pembimbing::factory()->create();
        $userId = $pembimbing->user_id;

        $this->actingAs($this->admin())
            ->delete("/pembimbings/{$pembimbing->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('pembimbings', ['id' => $pembimbing->id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_pembimbing_linked_to_industry_cannot_be_deleted(): void
    {
        $pembimbing = Pembimbing::factory()->create();
        Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        $this->actingAs($this->admin())
            ->delete("/pembimbings/{$pembimbing->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('pembimbings', ['id' => $pembimbing->id]);
    }
}
