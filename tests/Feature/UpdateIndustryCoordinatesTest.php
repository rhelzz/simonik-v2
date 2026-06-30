<?php

namespace Tests\Feature;

use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UpdateIndustryCoordinatesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    public function test_guests_cannot_update_coordinates(): void
    {
        $industry = Industry::factory()->create();

        $this->patch("/industries/{$industry->id}/coordinates", [
            'latitude' => '-6.123456',
            'longitude' => '106.123456',
            'radius' => 200,
        ])->assertRedirect('/login');
    }

    public function test_admin_can_update_any_industry_coordinates(): void
    {
        $admin = $this->user('admin');
        $industry = Industry::factory()->create();

        $this->actingAs($admin)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.123456',
                'longitude' => '106.123456',
                'radius' => 200,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('industries', [
            'id' => $industry->id,
            'latitude' => '-6.123456',
            'longitude' => '106.123456',
            'radius' => 200,
        ]);
    }

    public function test_kaprog_can_update_industry_of_their_department(): void
    {
        $kaprog = $this->user('kaprog');
        $departemen = Departemen::factory()->create(['user_id' => $kaprog->id]);

        $teacher = Teacher::factory()->create(['departemen_id' => $departemen->id]);
        $industry = Industry::factory()->create(['teacher_id' => $teacher->id]);

        $this->actingAs($kaprog)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.111222',
                'longitude' => '106.111222',
                'radius' => 150,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('industries', [
            'id' => $industry->id,
            'latitude' => '-6.111222',
            'longitude' => '106.111222',
            'radius' => 150,
        ]);
    }

    public function test_kaprog_can_update_industry_with_student_of_their_department(): void
    {
        $kaprog = $this->user('kaprog');
        $departemen = Departemen::factory()->create(['user_id' => $kaprog->id]);

        $industry = Industry::factory()->create(['teacher_id' => null]);

        // Buat student di industri ini dengan jurusan kaprog
        Student::factory()->create([
            'industri_id' => $industry->id,
            'departemen_id' => $departemen->id,
        ]);

        $this->actingAs($kaprog)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.222333',
                'longitude' => '106.222333',
                'radius' => 250,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('industries', [
            'id' => $industry->id,
            'latitude' => '-6.222333',
            'longitude' => '106.222333',
            'radius' => 250,
        ]);
    }

    public function test_kaprog_cannot_update_industry_outside_their_department(): void
    {
        $kaprog = $this->user('kaprog');
        $departemen = Departemen::factory()->create(['user_id' => $kaprog->id]);

        $otherDept = Departemen::factory()->create();
        $otherTeacher = Teacher::factory()->create(['departemen_id' => $otherDept->id]);
        $industry = Industry::factory()->create(['teacher_id' => $otherTeacher->id]);

        $this->actingAs($kaprog)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.111222',
                'longitude' => '106.111222',
                'radius' => 150,
            ])
            ->assertForbidden();
    }

    public function test_guru_can_update_supervised_industry_coordinates(): void
    {
        $guruUser = $this->user('guru');
        $guru = Teacher::factory()->create(['user_id' => $guruUser->id]);
        $industry = Industry::factory()->create(['teacher_id' => $guru->id]);

        $this->actingAs($guruUser)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.333444',
                'longitude' => '106.333444',
                'radius' => 180,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('industries', [
            'id' => $industry->id,
            'latitude' => '-6.333444',
            'longitude' => '106.333444',
            'radius' => 180,
        ]);
    }

    public function test_guru_cannot_update_unsupervised_industry_coordinates(): void
    {
        $guruUser = $this->user('guru');
        Teacher::factory()->create(['user_id' => $guruUser->id]); // registered as teacher

        $otherTeacher = Teacher::factory()->create();
        $industry = Industry::factory()->create(['teacher_id' => $otherTeacher->id]);

        $this->actingAs($guruUser)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.333444',
                'longitude' => '106.333444',
                'radius' => 180,
            ])
            ->assertForbidden();
    }

    public function test_pembimbing_can_update_own_industry_coordinates(): void
    {
        $pembimbingUser = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);
        $industry = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        $this->actingAs($pembimbingUser)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.444555',
                'longitude' => '106.444555',
                'radius' => 80,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('industries', [
            'id' => $industry->id,
            'latitude' => '-6.444555',
            'longitude' => '106.444555',
            'radius' => 80,
        ]);
    }

    public function test_pembimbing_cannot_update_other_industry_coordinates(): void
    {
        $pembimbingUser = $this->user('pembimbing');
        Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);

        $otherPembimbing = Pembimbing::factory()->create();
        $industry = Industry::factory()->create(['pembimbing_id' => $otherPembimbing->id]);

        $this->actingAs($pembimbingUser)
            ->patch("/industries/{$industry->id}/coordinates", [
                'latitude' => '-6.444555',
                'longitude' => '106.444555',
                'radius' => 80,
            ])
            ->assertForbidden();
    }

    public function test_unauthorized_roles_cannot_update_coordinates(): void
    {
        $industry = Industry::factory()->create();

        foreach (['siswa', 'orangtua', 'wakasek'] as $role) {
            $user = $this->user($role);
            $this->actingAs($user)
                ->patch("/industries/{$industry->id}/coordinates", [
                    'latitude' => '-6.555666',
                    'longitude' => '106.555666',
                    'radius' => 100,
                ])
                ->assertForbidden();
        }
    }
}
