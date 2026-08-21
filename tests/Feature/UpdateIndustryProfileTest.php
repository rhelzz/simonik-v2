<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * v2.4 Fase 25 — guru pembimbing (dan pemegang kewenangan per-industri lain)
 * bisa memperbaiki profil industri langsung dari halaman detail.
 */
class UpdateIndustryProfileTest extends TestCase
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
     * @return array{guru: User, teacher: Teacher, industry: Industry}
     */
    private function scenario(): array
    {
        $guru = $this->user('guru');
        $teacher = Teacher::factory()->create(['user_id' => $guru->id]);

        $industry = Industry::factory()->create([
            'teacher_id' => $teacher->id,
            'name' => 'PT Lama',
            'alamat' => 'Alamat lama',
        ]);

        return ['guru' => $guru, 'teacher' => $teacher, 'industry' => $industry];
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'PT Baru Jaya',
            'bidang' => 'Perangkat Lunak',
            'alamat' => 'Jl. Merdeka No. 1',
            'jam_masuk' => '08:00',
            'jam_pulang' => '16:00',
            'duration' => '6',
        ], $overrides);
    }

    public function test_guru_can_update_profile_of_own_industry(): void
    {
        $data = $this->scenario();

        $this->actingAs($data['guru'])
            ->patch("/industries/{$data['industry']->id}/profil", $this->payload())
            ->assertRedirect();

        $industry = $data['industry']->fresh();
        $this->assertSame('PT Baru Jaya', $industry?->name);
        $this->assertSame('Jl. Merdeka No. 1', $industry?->alamat);
    }

    /**
     * KEAMANAN: menyembunyikan tombol di UI bukan otorisasi — URL bisa ditebak.
     */
    public function test_guru_cannot_update_profile_of_another_industry(): void
    {
        $mine = $this->scenario();
        $other = $this->scenario();

        $this->actingAs($mine['guru'])
            ->patch("/industries/{$other['industry']->id}/profil", $this->payload())
            ->assertForbidden();

        $this->assertSame('PT Lama', $other['industry']->fresh()?->name);
    }

    /**
     * INTI FASE INI: relasi tidak boleh ikut berubah. Kalau `manage`
     * dilonggarkan atau all() dipakai alih-alih validated(), seorang guru bisa
     * memindahkan industri ke guru lain — dan itu memindahkan akses SELURUH
     * siswa di industri tersebut.
     */
    public function test_profile_update_ignores_relation_fields(): void
    {
        $data = $this->scenario();
        $otherTeacher = Teacher::factory()->create(['user_id' => $this->user('guru')->id]);
        $otherPembimbing = Pembimbing::factory()->create(['user_id' => $this->user('pembimbing')->id]);

        $this->actingAs($data['guru'])
            ->patch("/industries/{$data['industry']->id}/profil", $this->payload([
                'teacher_id' => $otherTeacher->id,
                'pembimbing_id' => $otherPembimbing->id,
            ]))
            ->assertRedirect();

        $industry = $data['industry']->fresh();
        $this->assertSame($data['teacher']->id, $industry?->teacher_id);
        $this->assertNotSame($otherPembimbing->id, $industry?->pembimbing_id);
    }

    /**
     * Koordinat punya editornya sendiri di halaman yang sama — form profil
     * tidak boleh ikut menyentuhnya, kalau tidak yang disimpan belakangan
     * menang diam-diam.
     */
    public function test_profile_update_does_not_touch_coordinates(): void
    {
        $data = $this->scenario();
        $data['industry']->update([
            'latitude' => '-6.914744',
            'longitude' => '107.609810',
            'radius' => 150,
        ]);

        $this->actingAs($data['guru'])
            ->patch("/industries/{$data['industry']->id}/profil", $this->payload([
                'latitude' => '0',
                'longitude' => '0',
                'radius' => 9999,
            ]))
            ->assertRedirect();

        $industry = $data['industry']->fresh();
        $this->assertSame('-6.914744', $industry?->latitude);
        $this->assertSame('107.609810', $industry?->longitude);
        $this->assertSame(150, $industry?->radius);
    }

    public function test_admin_can_update_profile(): void
    {
        $data = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->patch("/industries/{$data['industry']->id}/profil", $this->payload())
            ->assertRedirect();

        $this->assertSame('PT Baru Jaya', $data['industry']->fresh()?->name);
    }

    public function test_pembimbing_can_update_profile_of_own_industry(): void
    {
        $pembimbingUser = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);
        $industry = Industry::factory()->create([
            'pembimbing_id' => $pembimbing->id,
            'name' => 'PT Lama',
        ]);

        $this->actingAs($pembimbingUser)
            ->patch("/industries/{$industry->id}/profil", $this->payload())
            ->assertRedirect();

        $this->assertSame('PT Baru Jaya', $industry->fresh()?->name);
    }

    public function test_siswa_cannot_update_profile(): void
    {
        $data = $this->scenario();

        $this->actingAs($this->user('siswa'))
            ->patch("/industries/{$data['industry']->id}/profil", $this->payload())
            ->assertForbidden();

        $this->assertSame('PT Lama', $data['industry']->fresh()?->name);
    }

    public function test_jam_pulang_must_be_after_jam_masuk(): void
    {
        $data = $this->scenario();

        $this->actingAs($data['guru'])
            ->patch("/industries/{$data['industry']->id}/profil", $this->payload([
                'jam_masuk' => '16:00',
                'jam_pulang' => '08:00',
            ]))
            ->assertSessionHasErrors('jam_pulang');

        $this->assertSame('PT Lama', $data['industry']->fresh()?->name);
    }

    public function test_detail_page_exposes_update_profile_capability(): void
    {
        $data = $this->scenario();

        $this->actingAs($data['guru'])
            ->get("/industries/{$data['industry']->id}")
            ->assertInertia(fn ($page) => $page
                ->where('can.updateProfile', true)
                // Guru TETAP tidak mendapat halaman edit penuh milik admin.
                ->where('can.manage', false)
            );
    }
}
