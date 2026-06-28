<?php

namespace Tests\Feature;

use App\Models\Parents;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParentTest extends TestCase
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
            'nama' => 'Bapak Andi',
            'email' => 'andi@simonik.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'gender' => 'L',
            'alamat' => 'Jl. Kenanga No. 2',
            'occupation' => 'Wiraswasta',
            'phoneNumber' => '081234567890',
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/parents')->assertRedirect('/login');
    }

    public function test_non_admins_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/parents')->assertForbidden();
    }

    public function test_admin_can_view_parent_list(): void
    {
        $this->actingAs($this->admin())->get('/parents')->assertOk();
    }

    public function test_admin_can_create_a_parent_with_account(): void
    {
        $this->actingAs($this->admin())
            ->post('/parents', $this->validPayload())
            ->assertSessionHas('success');

        $this->assertDatabaseHas('parents', ['nama' => 'Bapak Andi']);
        $this->assertDatabaseHas('users', ['email' => 'andi@simonik.test']);

        $user = User::where('email', 'andi@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('orangtua'));
    }

    public function test_admin_can_update_a_parent(): void
    {
        $parent = Parents::factory()->create();

        $this->actingAs($this->admin())
            ->put("/parents/{$parent->id}", [
                'nama' => 'Nama Baru',
                'email' => 'baru@simonik.test',
                'gender' => 'P',
                'alamat' => $parent->alamat,
                'occupation' => 'Guru',
                'phoneNumber' => '089999999999',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('parents', [
            'id' => $parent->id,
            'nama' => 'Nama Baru',
            'occupation' => 'Guru',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $parent->user_id,
            'email' => 'baru@simonik.test',
        ]);
    }

    public function test_admin_can_delete_a_parent_and_its_account(): void
    {
        $parent = Parents::factory()->create();
        $userId = $parent->user_id;

        $this->actingAs($this->admin())
            ->delete("/parents/{$parent->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('parents', ['id' => $parent->id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_parent_with_students_cannot_be_deleted(): void
    {
        $parent = Parents::factory()->create();
        Student::factory()->create(['parent_id' => $parent->id]);

        $this->actingAs($this->admin())
            ->delete("/parents/{$parent->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('parents', ['id' => $parent->id]);
    }
}
