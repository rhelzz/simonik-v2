<?php

namespace Tests\Feature;

use App\Models\Announcement;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * v2.4 Fase 18 — Pengumuman multi-role dengan periode tayang.
 */
class AnnouncementTest extends TestCase
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
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Libur Idul Adha',
            'body' => '<p>PKL diliburkan.</p>',
            'roles' => ['siswa'],
            'starts_at' => Carbon::today()->toDateString(),
            'ends_at' => Carbon::today()->addWeek()->toDateString(),
        ], $overrides);
    }

    public function test_admin_can_create_announcement(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/pengumuman', $this->payload())
            ->assertRedirect('/pengumuman');

        $announcement = Announcement::query()->firstOrFail();
        $this->assertSame(['siswa'], $announcement->roles);
        $this->assertSame('Libur Idul Adha', $announcement->title);
    }

    public function test_guru_can_create_announcement(): void
    {
        $this->actingAs($this->user('guru'))
            ->post('/pengumuman', $this->payload())
            ->assertRedirect('/pengumuman')
            ->assertSessionHasNoErrors();

        $this->assertDatabaseCount('announcements', 1);
    }

    public function test_other_roles_cannot_access_announcements(): void
    {
        foreach (['siswa', 'orangtua', 'pembimbing', 'kaprog', 'wakasek'] as $role) {
            $this->actingAs($this->user($role))
                ->get('/pengumuman')
                ->assertForbidden();
        }
    }

    /**
     * "All User" menelan target lain — menyimpan ['*','siswa'] membuat data
     * ambigu tanpa menambah arti.
     */
    public function test_all_user_target_collapses_other_roles(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/pengumuman', $this->payload(['roles' => ['*', 'siswa', 'guru']]))
            ->assertRedirect();

        $this->assertSame(['*'], Announcement::query()->firstOrFail()->roles);
    }

    public function test_role_target_must_be_one_of_the_offered_options(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/pengumuman', $this->payload(['roles' => ['role-karangan']]))
            ->assertSessionHasErrors('roles.0');

        $this->assertDatabaseCount('announcements', 0);
    }

    public function test_end_date_cannot_precede_start_date(): void
    {
        $this->actingAs($this->user('admin'))
            ->post('/pengumuman', $this->payload([
                'starts_at' => '2026-08-20',
                'ends_at' => '2026-08-19',
            ]))
            ->assertSessionHasErrors('ends_at');
    }

    public function test_guru_only_sees_own_announcements(): void
    {
        $guruA = $this->user('guru');
        $guruB = $this->user('guru');

        Announcement::factory()->create(['user_id' => $guruA->id]);
        Announcement::factory()->create(['user_id' => $guruB->id]);

        $this->actingAs($guruA)
            ->get('/pengumuman')
            ->assertInertia(fn (Assert $page) => $page
                ->component('announcements/index')
                ->has('announcements.data', 1)
            );

        // Admin melihat keduanya.
        $this->actingAs($this->user('admin'))
            ->get('/pengumuman')
            ->assertInertia(fn (Assert $page) => $page->has('announcements.data', 2));
    }

    /**
     * Menyembunyikan dari daftar saja tidak cukup — URL bisa ditebak.
     */
    public function test_guru_cannot_edit_another_teachers_announcement(): void
    {
        $guruA = $this->user('guru');
        $guruB = $this->user('guru');
        $announcement = Announcement::factory()->create(['user_id' => $guruB->id]);

        $this->actingAs($guruA)->get("/pengumuman/{$announcement->id}/edit")->assertForbidden();
        $this->actingAs($guruA)->put("/pengumuman/{$announcement->id}", $this->payload())->assertForbidden();
        $this->actingAs($guruA)->delete("/pengumuman/{$announcement->id}")->assertForbidden();

        $this->assertDatabaseCount('announcements', 1);
    }

    /**
     * INTI FITUR: pengumuman hanya sampai ke role yang dituju.
     */
    public function test_dashboard_only_shares_announcements_targeting_the_user(): void
    {
        $admin = $this->user('admin');

        Announcement::factory()->create([
            'user_id' => $admin->id,
            'title' => 'Khusus murid',
            'roles' => ['siswa'],
        ]);

        $this->actingAs($this->user('siswa'))
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->has('dashboardAnnouncements', 1)
                ->where('dashboardAnnouncements.0.title', 'Khusus murid')
            );

        $this->actingAs($this->user('orangtua'))
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->has('dashboardAnnouncements', 0));
    }

    public function test_all_user_announcement_reaches_every_role(): void
    {
        $admin = $this->user('admin');
        Announcement::factory()->create(['user_id' => $admin->id, 'roles' => ['*']]);

        foreach (['siswa', 'orangtua', 'guru', 'pembimbing', 'kaprog', 'wakasek'] as $role) {
            $this->actingAs($this->user($role))
                ->get('/dashboard')
                ->assertInertia(fn (Assert $page) => $page->has('dashboardAnnouncements', 1));
        }
    }

    /**
     * Periode inklusif di kedua ujung — pengumuman ber-`ends_at` HARI INI
     * masih tampil hari ini.
     */
    public function test_dashboard_excludes_announcements_outside_their_period(): void
    {
        $admin = $this->user('admin');
        $today = Carbon::today();

        Announcement::factory()->create([
            'user_id' => $admin->id,
            'title' => 'Terjadwal besok',
            'roles' => ['*'],
            'starts_at' => $today->copy()->addDay(),
            'ends_at' => $today->copy()->addWeek(),
        ]);
        Announcement::factory()->create([
            'user_id' => $admin->id,
            'title' => 'Sudah berakhir',
            'roles' => ['*'],
            'starts_at' => $today->copy()->subWeek(),
            'ends_at' => $today->copy()->subDay(),
        ]);
        Announcement::factory()->create([
            'user_id' => $admin->id,
            'title' => 'Berakhir hari ini',
            'roles' => ['*'],
            'starts_at' => $today->copy()->subWeek(),
            'ends_at' => $today->copy(),
        ]);

        $this->actingAs($this->user('siswa'))
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->has('dashboardAnnouncements', 1)
                ->where('dashboardAnnouncements.0.title', 'Berakhir hari ini')
            );
    }

    /**
     * share() dieksekusi di SETIAP request Inertia — kuerinya harus lazy dan
     * hanya jalan di dashboard.
     */
    public function test_announcements_are_not_loaded_outside_the_dashboard(): void
    {
        $admin = $this->user('admin');
        Announcement::factory()->create(['user_id' => $admin->id, 'roles' => ['*']]);

        $this->actingAs($admin)
            ->get('/pengumuman')
            ->assertInertia(fn (Assert $page) => $page->has('dashboardAnnouncements', 0));
    }

    public function test_admin_can_update_and_delete_announcement(): void
    {
        $admin = $this->user('admin');
        $announcement = Announcement::factory()->create(['user_id' => $admin->id]);

        $this->actingAs($admin)
            ->put("/pengumuman/{$announcement->id}", $this->payload(['title' => 'Judul baru']))
            ->assertRedirect('/pengumuman');

        $this->assertSame('Judul baru', $announcement->fresh()?->title);

        $this->actingAs($admin)
            ->delete("/pengumuman/{$announcement->id}")
            ->assertRedirect();

        $this->assertDatabaseCount('announcements', 0);
    }
}
