<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
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

    public function test_gender_filter_matches_aliases_and_ignores_junk(): void
    {
        Pembimbing::factory()->create(['name' => 'Pria L', 'gender' => 'L']);
        Pembimbing::factory()->create(['name' => 'Pria male', 'gender' => 'male']);
        Pembimbing::factory()->create(['name' => 'Wanita P', 'gender' => 'P']);

        $admin = $this->admin();

        // 'L' juga menjaring varian 'male'/'m'/'l' dari sumber data lain.
        $this->actingAs($admin)
            ->get('/pembimbings?gender=L')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('pembimbings.data', 2)
                ->where('filters.gender', 'L')
            );

        // Nilai di luar whitelist diabaikan, bukan bikin error.
        $this->actingAs($admin)
            ->get('/pembimbings?gender=xyz')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('pembimbings.data', 3)
                ->where('filters.gender', null)
            );
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

    public function test_admin_can_change_pembimbing_password(): void
    {
        $pembimbing = Pembimbing::factory()->create();

        $this->actingAs($this->admin())
            ->put("/pembimbings/{$pembimbing->id}", [
                'name' => $pembimbing->name,
                'email' => $pembimbing->user->email,
                'no_hp' => '089999999999',
                'gender' => 'L',
                'password' => 'RahasiaBaru123',
                'password_confirmation' => 'RahasiaBaru123',
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertTrue(Hash::check('RahasiaBaru123', $pembimbing->user->refresh()->password));
    }

    public function test_pembimbing_password_unchanged_when_left_blank(): void
    {
        $pembimbing = Pembimbing::factory()->create();
        $before = $pembimbing->user->password;

        $this->actingAs($this->admin())
            ->put("/pembimbings/{$pembimbing->id}", [
                'name' => $pembimbing->name,
                'email' => $pembimbing->user->email,
                'no_hp' => '089999999999',
                'gender' => 'L',
                'password' => '',
            ])
            ->assertRedirect();

        $this->assertSame($before, $pembimbing->user->refresh()->password);
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
