<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class IndustryTest extends TestCase
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
            'name' => 'PT Maju Jaya',
            'email' => 'maju@simonik.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'bidang' => 'Software House',
            'alamat' => 'Jl. Merdeka No. 1',
            'longitude' => '107.609810',
            'latitude' => '-6.914744',
            'industryMentorName' => 'Andi Wijaya',
            'industryMentorNo' => '081234567890',
            'duration' => '6 Bulan',
            'pembimbing_id' => null,
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/industries')->assertRedirect('/login');
    }

    public function test_students_without_permission_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/industries')->assertForbidden();
    }

    public function test_admin_can_view_industry_list(): void
    {
        $this->actingAs($this->admin())->get('/industries')->assertOk();
    }

    public function test_admin_can_create_an_industry_with_mitra_account(): void
    {
        $this->actingAs($this->admin())
            ->post('/industries', $this->validPayload())
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'name' => 'PT Maju Jaya',
            'bidang' => 'Software House',
        ]);
        $this->assertDatabaseHas('users', ['email' => 'maju@simonik.test']);

        $user = User::where('email', 'maju@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('mitra'));
    }

    public function test_admin_can_create_an_industry_with_pembimbing(): void
    {
        $pembimbing = Pembimbing::factory()->create();

        $this->actingAs($this->admin())
            ->post('/industries', [
                ...$this->validPayload(),
                'pembimbing_id' => $pembimbing->id,
            ])
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'name' => 'PT Maju Jaya',
            'pembimbing_id' => $pembimbing->id,
        ]);
    }

    public function test_admin_can_update_an_industry(): void
    {
        $industry = Industry::factory()->create();

        $payload = [
            'name' => 'PT Baru',
            'email' => 'baru@simonik.test',
            'bidang' => 'Jaringan',
            'alamat' => $industry->alamat,
            'longitude' => $industry->longitude,
            'latitude' => $industry->latitude,
            'industryMentorName' => $industry->industryMentorName,
            'industryMentorNo' => $industry->industryMentorNo,
            'duration' => $industry->duration,
            'pembimbing_id' => null,
        ];

        $this->actingAs($this->admin())
            ->put("/industries/{$industry->id}", $payload)
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'id' => $industry->id,
            'name' => 'PT Baru',
            'bidang' => 'Jaringan',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $industry->user_id,
            'email' => 'baru@simonik.test',
        ]);
    }

    public function test_admin_can_delete_an_industry_and_its_account(): void
    {
        $industry = Industry::factory()->create();
        $userId = $industry->user_id;

        $this->actingAs($this->admin())
            ->delete("/industries/{$industry->id}")
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseMissing('industries', ['id' => $industry->id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_industry_with_students_cannot_be_deleted(): void
    {
        $industry = Industry::factory()->create();
        Student::factory()->create(['industri_id' => $industry->id]);

        $this->actingAs($this->admin())
            ->delete("/industries/{$industry->id}")
            ->assertSessionHas('error');

        $this->assertDatabaseHas('industries', ['id' => $industry->id]);
    }
}
