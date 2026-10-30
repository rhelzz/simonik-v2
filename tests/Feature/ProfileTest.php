<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

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
                'email' => 'baru@simonik.local',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nama Baru',
            'email' => 'baru@simonik.local',
        ]);
    }

    public function test_profile_update_rejects_duplicate_email(): void
    {
        $other = User::factory()->create(['email' => 'taken@simonik.local']);
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
        $user = User::factory()->create(['email' => 'me@simonik.local']);

        $this->actingAs($user)
            ->patch('/profile', [
                'name' => 'Nama Saya',
                'email' => 'me@simonik.local',
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

    public function test_pembimbing_can_update_dudi_industry_profile(): void
    {
        $user = User::factory()->create();
        $user->assignRole('pembimbing');

        $pembimbing = \App\Models\Pembimbing::factory()->create(['user_id' => $user->id]);
        $industry = \App\Models\Industry::factory()->create([
            'pembimbing_id' => $pembimbing->id,
            'name' => 'PT Lama',
            'alamat' => 'Alamat lama',
        ]);

        $payload = [
            'nib' => '1234567890123',
            'name' => 'PT Baru Maju',
            'bidang' => 'Teknologi Informasi',
            'alamat' => 'Jl. Jendral Sudirman No. 10',
            'rt' => '001',
            'rw' => '002',
            'dusun' => 'Dusun Satu',
            'kelurahan' => 'Kelurahan A',
            'kecamatan' => 'Kecamatan B',
            'kode_pos' => '12345',
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
            'email' => 'kontak@barumaju.co.id',
            'website' => 'https://barumaju.co.id',
            'npwp' => '01.234.567.8-901.000',
        ];

        $response = $this->actingAs($user)->patch('/profile/industri', $payload);

        $response->assertSessionHas('success');

        $this->assertDatabaseHas('industries', array_merge(['id' => $industry->id], $payload));
        $this->assertTrue($industry->fresh()->hasCompleteDudiProfile());
    }
}
