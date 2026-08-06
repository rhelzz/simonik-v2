<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Relasi pembimbing ↔ industri dimiliki sisi industri
 * (`industries.pembimbing_id`, kolom tunggal), jadi satu industri hanya
 * menampung satu pembimbing. Form pembimbing kini bisa menetapkannya langsung
 * tanpa berpindah ke modul Data Industri.
 */
class PembimbingIndustryTest extends TestCase
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
    private function payload(array $extra = []): array
    {
        return [
            'name' => 'Budi Hartono',
            'email' => 'budi.hartono',
            'password' => 'kata-sandi-rahasia',
            'password_confirmation' => 'kata-sandi-rahasia',
            'no_hp' => '081200001111',
            ...$extra,
        ];
    }

    public function test_pembimbing_baru_dapat_langsung_ditugaskan_ke_industri(): void
    {
        $industry = Industry::factory()->create(['pembimbing_id' => null]);

        $this->actingAs($this->admin())
            ->post('/pembimbings', $this->payload(['industry_id' => $industry->id]))
            ->assertSessionHasNoErrors();

        $pembimbing = Pembimbing::where('name', 'Budi Hartono')->firstOrFail();

        $this->assertDatabaseHas('industries', [
            'id' => $industry->id,
            'pembimbing_id' => $pembimbing->id,
        ]);
    }

    public function test_industri_boleh_dikosongkan(): void
    {
        $this->actingAs($this->admin())
            ->post('/pembimbings', $this->payload())
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('pembimbings', ['name' => 'Budi Hartono']);
    }

    public function test_mengganti_industri_melepas_industri_lama(): void
    {
        $pembimbing = Pembimbing::factory()->create();
        $lama = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);
        $baru = Industry::factory()->create(['pembimbing_id' => null]);

        $this->actingAs($this->admin())
            ->put("/pembimbings/{$pembimbing->id}", [
                'name' => $pembimbing->name,
                'email' => $pembimbing->user?->email ?? 'x@simonik.local',
                'no_hp' => '08123',
                'industry_id' => $baru->id,
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('industries', ['id' => $lama->id, 'pembimbing_id' => null]);
        $this->assertDatabaseHas('industries', ['id' => $baru->id, 'pembimbing_id' => $pembimbing->id]);
    }

    public function test_mengosongkan_industri_melepas_penugasan(): void
    {
        $pembimbing = Pembimbing::factory()->create();
        $industry = Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        $this->actingAs($this->admin())
            ->put("/pembimbings/{$pembimbing->id}", [
                'name' => $pembimbing->name,
                'email' => $pembimbing->user?->email ?? 'x@simonik.local',
                'no_hp' => '08123',
                'industry_id' => null,
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('industries', ['id' => $industry->id, 'pembimbing_id' => null]);
    }

    public function test_mengklaim_industri_milik_pembimbing_lain_menggeser_pemilik_lama(): void
    {
        // Perilaku yang disengaja, bukan kecelakaan: `industries.pembimbing_id`
        // kolom tunggal, dan form sudah memperingatkan sebelum menyimpan.
        $lama = Pembimbing::factory()->create();
        $industry = Industry::factory()->create(['pembimbing_id' => $lama->id]);

        $this->actingAs($this->admin())
            ->post('/pembimbings', $this->payload(['industry_id' => $industry->id]))
            ->assertSessionHasNoErrors();

        $baru = Pembimbing::where('name', 'Budi Hartono')->firstOrFail();

        $this->assertDatabaseHas('industries', ['id' => $industry->id, 'pembimbing_id' => $baru->id]);
        $this->assertSame(0, Industry::where('pembimbing_id', $lama->id)->count());
    }

    public function test_form_menandai_industri_yang_sudah_dipegang(): void
    {
        $lama = Pembimbing::factory()->create(['name' => 'Rina']);
        Industry::factory()->create(['name' => 'PT Maju Jaya', 'pembimbing_id' => $lama->id]);
        Industry::factory()->create(['name' => 'PT Bebas', 'pembimbing_id' => null]);

        $this->actingAs($this->admin())
            ->get('/pembimbings/create')
            ->assertInertia(fn ($page) => $page
                ->has('industries', 2)
                ->where('industries.0.name', 'PT Bebas')
                ->where('industries.0.taken_by', null)
                ->where('industries.1.name', 'PT Maju Jaya')
                ->where('industries.1.taken_by', 'Rina'));
    }

    public function test_industri_sendiri_tidak_ditandai_saat_menyunting(): void
    {
        $pembimbing = Pembimbing::factory()->create(['name' => 'Rina']);
        Industry::factory()->create(['name' => 'PT Maju Jaya', 'pembimbing_id' => $pembimbing->id]);

        $this->actingAs($this->admin())
            ->get("/pembimbings/{$pembimbing->id}/edit")
            ->assertInertia(fn ($page) => $page
                ->where('industries.0.taken_by', null));
    }
}
