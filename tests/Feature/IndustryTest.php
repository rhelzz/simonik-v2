<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
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
            'radius' => 100,
            'jam_masuk' => '08:00',
            'jam_pulang' => '17:00',
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

    /**
     * Guru pembimbing berwenang menentukan titik absensi industri bimbingannya,
     * tapi sebelumnya tidak punya halaman apa pun untuk membukanya.
     */
    public function test_guru_sees_only_industries_it_supervises(): void
    {
        $guruUser = User::factory()->create();
        $guruUser->assignRole('guru');
        $teacher = Teacher::factory()->create(['user_id' => $guruUser->id]);

        $own = Industry::factory()->create(['teacher_id' => $teacher->id]);
        $foreign = Industry::factory()->create();

        $this->actingAs($guruUser)
            ->get('/industries')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('industries.data', 1)
                ->where('industries.data.0.id', $own->id)
                ->where('can.manage', false)
            );

        $this->actingAs($guruUser)
            ->get("/industries/{$own->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('can.updateCoordinates', true));

        $this->actingAs($guruUser)->get("/industries/{$foreign->id}")->assertForbidden();
    }

    public function test_guru_cannot_create_or_delete_industries(): void
    {
        $guruUser = User::factory()->create();
        $guruUser->assignRole('guru');
        Teacher::factory()->create(['user_id' => $guruUser->id]);

        $industry = Industry::factory()->create();

        $this->actingAs($guruUser)->get('/industries/create')->assertForbidden();
        $this->actingAs($guruUser)->post('/industries', $this->validPayload())->assertForbidden();
        $this->actingAs($guruUser)->delete("/industries/{$industry->id}")->assertForbidden();
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

    public function test_admin_can_create_an_industry_without_coordinates(): void
    {
        $this->actingAs($this->admin())
            ->post('/industries', [
                ...$this->validPayload(),
                'longitude' => null,
                'latitude' => null,
            ])
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'name' => 'PT Maju Jaya',
            'longitude' => null,
            'latitude' => null,
        ]);
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
            'radius' => 120,
            'jam_masuk' => '08:00',
            'jam_pulang' => '17:00',
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
            'jam_masuk' => '08:00',
            'jam_pulang' => '17:00',
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
