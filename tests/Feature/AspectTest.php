<?php

namespace Tests\Feature;

use App\Models\AspekProduktif;
use App\Models\Evaluation;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AspectTest extends TestCase
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

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/aspects')->assertRedirect('/login');
    }

    public function test_non_admins_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/aspects')->assertForbidden();
    }

    public function test_admin_can_view_aspect_list(): void
    {
        $this->actingAs($this->admin())->get('/aspects')->assertOk();
    }

    public function test_admin_can_create_an_aspect(): void
    {
        $this->actingAs($this->admin())
            ->post('/aspects', [
                'category' => 'teknis',
                'no' => 1,
                'kemampuan' => 'Kualitas hasil kerja',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('aspek_produktifs', [
            'category' => 'teknis',
            'kemampuan' => 'Kualitas hasil kerja',
        ]);
    }

    public function test_category_must_be_valid(): void
    {
        $this->actingAs($this->admin())
            ->post('/aspects', [
                'category' => 'lainnya',
                'no' => 1,
                'kemampuan' => 'Aspek tak valid',
            ])
            ->assertSessionHasErrors('category');
    }

    public function test_kemampuan_is_required(): void
    {
        $this->actingAs($this->admin())
            ->post('/aspects', [
                'category' => 'non_teknis',
                'no' => 1,
            ])
            ->assertSessionHasErrors('kemampuan');
    }

    public function test_admin_can_update_an_aspect(): void
    {
        $aspect = AspekProduktif::factory()->teknis()->create();

        $this->actingAs($this->admin())
            ->put("/aspects/{$aspect->id}", [
                'category' => 'non_teknis',
                'no' => 5,
                'kemampuan' => 'Disiplin & kehadiran',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('aspek_produktifs', [
            'id' => $aspect->id,
            'category' => 'non_teknis',
            'no' => 5,
            'kemampuan' => 'Disiplin & kehadiran',
        ]);
    }

    public function test_deleting_an_aspect_cascades_to_scores(): void
    {
        $aspect = AspekProduktif::factory()->create();
        $evaluation = Evaluation::factory()->create([
            'aspek_produktif_id' => $aspect->id,
        ]);

        $this->actingAs($this->admin())
            ->delete("/aspects/{$aspect->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('aspek_produktifs', ['id' => $aspect->id]);
        $this->assertDatabaseMissing('evaluations', ['id' => $evaluation->id]);
    }
}
