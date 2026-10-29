<?php

namespace Tests\Feature;

use App\Models\Departemen;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create(['name' => 'Admin User', 'email' => 'admin@simonik.local']);
        $user->assignRole('admin');

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/users')->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_user_management(): void
    {
        $student = User::factory()->create();
        $student->assignRole('siswa');

        $this->actingAs($student)->get('/users')->assertForbidden();

        $teacher = User::factory()->create();
        $teacher->assignRole('guru');

        $this->actingAs($teacher)->get('/users')->assertForbidden();
    }

    public function test_admin_can_view_users_list(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->get('/users')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('users/index')
                ->has('users.data')
                ->has('availableRoles')
                ->where('filters.search', '')
                ->where('filters.role', '')
            );
    }

    public function test_admin_can_search_user_by_name_or_email(): void
    {
        $admin = $this->admin();

        $target = User::factory()->create(['name' => 'Budi Santoso', 'email' => 'budi@example.com']);
        $target->assignRole('guru');

        $other = User::factory()->create(['name' => 'Siti Rahma', 'email' => 'siti@example.com']);
        $other->assignRole('siswa');

        $this->actingAs($admin)
            ->get('/users?search=Budi')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('users/index')
                ->has('users.data', 1)
                ->where('users.data.0.name', 'Budi Santoso')
            );

        $this->actingAs($admin)
            ->get('/users?search=siti@example.com')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('users/index')
                ->has('users.data', 1)
                ->where('users.data.0.name', 'Siti Rahma')
            );
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        $admin = $this->admin();

        $guru = User::factory()->create(['name' => 'Guru A']);
        $guru->assignRole('guru');

        $siswa = User::factory()->create(['name' => 'Siswa B']);
        $siswa->assignRole('siswa');

        $this->actingAs($admin)
            ->get('/users?role=guru')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('users/index')
                ->has('users.data', 1)
                ->where('users.data.0.name', 'Guru A')
                ->where('users.data.0.roles.0', 'guru')
            );
    }

    public function test_user_phone_and_keterangan_are_resolved_correctly(): void
    {
        $admin = $this->admin();

        $dept = Departemen::factory()->create(['name' => 'Rekayasa Perangkat Lunak']);
        $guruUser = User::factory()->create(['name' => 'Pak Joko']);
        $guruUser->assignRole('guru');
        Teacher::factory()->create([
            'user_id' => $guruUser->id,
            'name' => 'Pak Joko',
            'no_hp' => '081234567890',
            'departemen_id' => $dept->id,
        ]);

        $this->actingAs($admin)
            ->get('/users?search=Joko')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('users/index')
                ->has('users.data', 1)
                ->where('users.data.0.no_hp', '081234567890')
                ->where('users.data.0.keterangan', 'Guru: Rekayasa Perangkat Lunak')
                ->where('users.data.0.password_masked', '••••••••')
            );
    }

    public function test_admin_can_reset_single_user_password_to_default(): void
    {
        $admin = $this->admin();
        $target = User::factory()->create(['password' => 'secret123']);

        $this->actingAs($admin)
            ->post("/users/{$target->id}/reset-password")
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password', $target->fresh()->password));
    }

    public function test_admin_cannot_reset_their_own_password(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post("/users/{$admin->id}/reset-password")
            ->assertRedirect()
            ->assertSessionHas('error');
    }

    public function test_admin_can_bulk_reset_passwords(): void
    {
        $admin = $this->admin();
        $u1 = User::factory()->create(['password' => 'secret1']);
        $u2 = User::factory()->create(['password' => 'secret2']);

        $this->actingAs($admin)
            ->post('/users/bulk-reset-password', [
                'ids' => [$u1->id, $u2->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password', $u1->fresh()->password));
        $this->assertTrue(\Illuminate\Support\Facades\Hash::check('password', $u2->fresh()->password));
    }

    public function test_admin_can_delete_user(): void
    {
        $admin = $this->admin();
        $target = User::factory()->create();

        $this->actingAs($admin)
            ->delete("/users/{$target->id}")
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('users', ['id' => $target->id]);
    }

    public function test_admin_cannot_delete_themselves(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->delete("/users/{$admin->id}")
            ->assertRedirect()
            ->assertSessionHas('error');

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_admin_can_bulk_delete_users(): void
    {
        $admin = $this->admin();
        $u1 = User::factory()->create();
        $u2 = User::factory()->create();

        $this->actingAs($admin)
            ->delete('/users/bulk', [
                'ids' => [$u1->id, $u2->id],
            ])
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('users', ['id' => $u1->id]);
        $this->assertDatabaseMissing('users', ['id' => $u2->id]);
    }
}
