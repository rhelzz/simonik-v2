<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MyIndustryTest extends TestCase
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

    /**
     * Pembimbing dengan industri + 1 anak magang.
     *
     * @return array{user: User, industry: Industry}
     */
    private function pembimbingWithIndustry(): array
    {
        $user = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $user->id]);
        $industry = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        // Tanggal PKL diisi agar rate dihitung lewat hari kerja efektif
        // (memastikan jalur countWeekdays dengan date cast immutable berjalan).
        Student::factory()->create([
            'industri_id' => $industry->id,
            'pkl_start' => now()->subMonth()->toDateString(),
            'pkl_end' => now()->addMonth()->toDateString(),
        ]);

        return ['user' => $user, 'industry' => $industry];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/industri-saya')->assertRedirect('/login');
    }

    public function test_non_pembimbing_is_forbidden(): void
    {
        $this->actingAs($this->user('admin'))
            ->get('/industri-saya')
            ->assertForbidden();
    }

    public function test_pembimbing_sees_own_industry_with_roster(): void
    {
        $s = $this->pembimbingWithIndustry();

        $this->actingAs($s['user'])
            ->get('/industri-saya')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('my-industry/show')
                ->where('industry.id', $s['industry']->id)
                ->has('roster', 1)
                ->has('roster.0.performance.attendanceRate')
            );
    }

    public function test_pembimbing_without_industry_sees_empty_state(): void
    {
        $user = $this->user('pembimbing');
        Pembimbing::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->get('/industri-saya')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('my-industry/show')
                ->where('industry', null)
                ->where('roster', [])
            );
    }

    public function test_pembimbing_can_update_own_industry(): void
    {
        $s = $this->pembimbingWithIndustry();

        $this->actingAs($s['user'])
            ->put('/industri-saya', [
                'name' => 'PT Diperbarui',
                'bidang' => 'Multimedia',
                'alamat' => 'Jl. Baru No. 9',
                'longitude' => '110.0',
                'latitude' => '-7.0',
                'radius' => 150,
                'jam_masuk' => '08:00',
                'jam_pulang' => '17:00',
                'duration' => '3 Bulan',
            ])
            ->assertRedirect(route('my-industry.show'));

        $this->assertDatabaseHas('industries', [
            'id' => $s['industry']->id,
            'name' => 'PT Diperbarui',
            'bidang' => 'Multimedia',
            'jam_masuk' => '08:00',
            'jam_pulang' => '17:00',
        ]);
    }

    public function test_pembimbing_without_industry_cannot_edit(): void
    {
        $user = $this->user('pembimbing');
        Pembimbing::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)->get('/industri-saya/edit')->assertNotFound();
    }
}
