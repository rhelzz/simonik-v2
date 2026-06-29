<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
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
            'bidang' => 'Software House',
            'alamat' => 'Jl. Merdeka No. 1',
            'longitude' => '107.609810',
            'latitude' => '-6.914744',
            'duration' => '6 Bulan',
            'teacher_id' => null,
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

    public function test_admin_can_create_an_industry_without_an_account(): void
    {
        $admin = $this->admin();
        $usersBefore = User::query()->count();

        $this->actingAs($admin)
            ->post('/industries', $this->validPayload())
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'name' => 'PT Maju Jaya',
            'bidang' => 'Software House',
        ]);

        // Industri hanya container — tidak membuat akun User.
        $this->assertSame($usersBefore, User::query()->count());
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

    public function test_admin_can_assign_guru_pembimbing_to_industry(): void
    {
        $teacher = Teacher::factory()->create();

        $this->actingAs($this->admin())
            ->post('/industries', [
                ...$this->validPayload(),
                'teacher_id' => $teacher->id,
            ])
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'name' => 'PT Maju Jaya',
            'teacher_id' => $teacher->id,
        ]);
    }

    public function test_admin_can_update_an_industry(): void
    {
        $industry = Industry::factory()->create();

        $payload = [
            'name' => 'PT Baru',
            'bidang' => 'Jaringan',
            'alamat' => $industry->alamat,
            'longitude' => $industry->longitude,
            'latitude' => $industry->latitude,
            'duration' => $industry->duration,
            'teacher_id' => null,
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
    }

    public function test_admin_can_delete_an_industry(): void
    {
        $industry = Industry::factory()->create();

        $this->actingAs($this->admin())
            ->delete("/industries/{$industry->id}")
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseMissing('industries', ['id' => $industry->id]);
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
