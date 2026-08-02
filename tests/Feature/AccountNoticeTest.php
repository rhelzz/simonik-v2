<?php

namespace Tests\Feature;

use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Akun guru/pembimbing yang belum tertaut ke industri melihat seluruh halaman
 * kosong (ScopesStudentsByRole mencocokkan id persis, tidak pernah NULL).
 * Spanduk global harus menyebut sebabnya agar tidak terbaca sebagai fitur rusak.
 */
class AccountNoticeTest extends TestCase
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

    public function test_guru_without_teacher_profile_is_warned(): void
    {
        $this->actingAs($this->user('guru'))
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.accountNotice', fn (?string $notice) => $notice !== null
                    && str_contains($notice, 'belum memiliki data Guru Pembimbing')
                )
            );
    }

    public function test_guru_without_any_industry_is_warned(): void
    {
        $guru = $this->user('guru');
        Teacher::factory()->create(['user_id' => $guru->id]);

        $this->actingAs($guru)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.accountNotice', fn (?string $notice) => $notice !== null
                    && str_contains($notice, 'belum ditugaskan sebagai guru pembimbing')
                )
            );
    }

    public function test_linked_guru_is_not_warned(): void
    {
        $guru = $this->user('guru');
        $teacher = Teacher::factory()->create(['user_id' => $guru->id]);
        Industry::factory()->create(['teacher_id' => $teacher->id]);

        $this->actingAs($guru)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('auth.accountNotice', null));
    }

    public function test_pembimbing_without_industry_is_warned(): void
    {
        $pembimbing = $this->user('pembimbing');
        Pembimbing::factory()->create(['user_id' => $pembimbing->id]);

        $this->actingAs($pembimbing)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.accountNotice', fn (?string $notice) => $notice !== null
                    && str_contains($notice, 'belum ditautkan ke industri')
                )
            );
    }

    public function test_linked_pembimbing_is_not_warned(): void
    {
        $user = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $user->id]);
        Industry::factory()->create(['pembimbing_id' => $pembimbing->id]);

        $this->actingAs($user)
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('auth.accountNotice', null));
    }

    public function test_admin_is_never_warned(): void
    {
        $this->actingAs($this->user('admin'))
            ->get('/dashboard')
            ->assertInertia(fn (Assert $page) => $page->where('auth.accountNotice', null));
    }
}
