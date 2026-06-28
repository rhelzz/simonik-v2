<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_view_profile(): void
    {
        $this->get('/profile')->assertRedirect('/login');
    }

    public function test_user_can_view_profile(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/profile')
            ->assertOk();
    }

    public function test_user_can_update_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => 'Nama Baru',
                'email' => 'baru@simonik.test',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nama Baru',
            'email' => 'baru@simonik.test',
        ]);
    }

    public function test_profile_update_rejects_duplicate_email(): void
    {
        $other = User::factory()->create(['email' => 'taken@simonik.test']);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => 'Nama',
                'email' => $other->email,
            ])
            ->assertSessionHasErrors('email');
    }

    public function test_user_can_keep_their_own_email(): void
    {
        $user = User::factory()->create(['email' => 'me@simonik.test']);

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => 'Nama Saya',
                'email' => 'me@simonik.test',
            ])
            ->assertSessionHasNoErrors();
    }

    public function test_user_can_change_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put('/password', [
                'current_password' => 'password',
                'password' => 'kata-sandi-baru',
                'password_confirmation' => 'kata-sandi-baru',
            ])
            ->assertSessionHas('success');

        $this->assertTrue(Hash::check('kata-sandi-baru', $user->fresh()->password));
    }

    public function test_password_change_requires_correct_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->put('/password', [
                'current_password' => 'salah',
                'password' => 'kata-sandi-baru',
                'password_confirmation' => 'kata-sandi-baru',
            ])
            ->assertSessionHasErrors('current_password');
    }
}
