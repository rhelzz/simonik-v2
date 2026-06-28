<?php

namespace Tests\Feature;

use App\Models\PKLPeriod;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PeriodTest extends TestCase
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
        $this->get('/periods')->assertRedirect('/login');
    }

    public function test_non_admins_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/periods')->assertForbidden();
    }

    public function test_admin_can_view_period_list(): void
    {
        $this->actingAs($this->admin())->get('/periods')->assertOk();
    }

    public function test_admin_can_create_a_period(): void
    {
        $this->actingAs($this->admin())
            ->post('/periods', [
                'name_period' => 'Gelombang 1 - 2026',
                'start_period' => '2026-01-06',
                'end_period' => '2026-04-06',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('p_k_l_periods', [
            'name_period' => 'Gelombang 1 - 2026',
        ]);
    }

    public function test_end_date_must_not_precede_start_date(): void
    {
        $this->actingAs($this->admin())
            ->post('/periods', [
                'name_period' => 'Gelombang Salah',
                'start_period' => '2026-04-06',
                'end_period' => '2026-01-06',
            ])
            ->assertSessionHasErrors('end_period');
    }

    public function test_admin_can_update_a_period(): void
    {
        $period = PKLPeriod::factory()->create();

        $this->actingAs($this->admin())
            ->put("/periods/{$period->id}", [
                'name_period' => 'Gelombang Diperbarui',
                'start_period' => '2026-02-01',
                'end_period' => '2026-05-01',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('p_k_l_periods', [
            'id' => $period->id,
            'name_period' => 'Gelombang Diperbarui',
        ]);
    }

    public function test_admin_can_delete_a_period(): void
    {
        $period = PKLPeriod::factory()->create();

        $this->actingAs($this->admin())
            ->delete("/periods/{$period->id}")
            ->assertSessionHas('success');

        $this->assertDatabaseMissing('p_k_l_periods', ['id' => $period->id]);
    }
}
