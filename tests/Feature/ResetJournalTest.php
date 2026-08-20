<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Attendance;
use App\Models\Badge;
use App\Models\Classes;
use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * v2.4 Fase 20 — reset data jurnal.
 *
 * Lebih sedikit test daripada Fase 19 karena action-nya sudah diuji di sana;
 * yang diuji di sini adalah PENYAMBUNGANNYA — terutama bahwa modul yang
 * direset benar-benar jurnal, bukan absen.
 */
class ResetJournalTest extends TestCase
{
    use RefreshDatabase;

    private const PASSWORD = 'rahasia-admin';

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create(['password' => Hash::make(self::PASSWORD)]);
        $user->assignRole('admin');

        return $user;
    }

    private function user(string $role): User
    {
        $user = User::factory()->create(['password' => Hash::make(self::PASSWORD)]);
        $user->assignRole($role);

        return $user;
    }

    /**
     * Siswa + satu jurnal (+ satu absen, agar setiap test ikut membuktikan
     * modul absen tidak tersentuh).
     *
     * @param  array<string, mixed>  $studentAttributes
     */
    private function studentWithRecords(array $studentAttributes = []): Student
    {
        $student = Student::factory()->create(array_merge([
            'user_id' => $this->user('siswa')->id,
        ], $studentAttributes));

        Activity::factory()->create([
            'user_id' => $student->user_id,
            'date' => '2026-08-10',
        ]);

        Attendance::factory()->create([
            'user_id' => $student->user_id,
            'date' => '2026-08-10',
            'status' => 'hadir',
        ]);

        return $student;
    }

    public function test_admin_can_reset_journal_by_class(): void
    {
        $target = Classes::factory()->create();
        $other = Classes::factory()->create();

        $this->studentWithRecords(['class_id' => $target->id]);
        $survivor = $this->studentWithRecords(['class_id' => $other->id]);

        $this->actingAs($this->admin())
            ->delete('/monitoring/jurnal/reset', [
                'password' => self::PASSWORD,
                'class_id' => $target->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('activities', 1);
        $this->assertDatabaseHas('activities', ['user_id' => $survivor->user_id]);
    }

    /**
     * Jurnal tidak punya kolom industri — penyaringan terjadi di sisi siswa
     * (students.industri_id), tanpa satu baris kode tambahan.
     */
    public function test_admin_can_reset_journal_by_industry(): void
    {
        $target = Industry::factory()->create();
        $other = Industry::factory()->create();

        $this->studentWithRecords(['industri_id' => $target->id]);
        $survivor = $this->studentWithRecords(['industri_id' => $other->id]);

        $this->actingAs($this->admin())
            ->delete('/monitoring/jurnal/reset', [
                'password' => self::PASSWORD,
                'industri_id' => $target->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('activities', 1);
        $this->assertDatabaseHas('activities', ['user_id' => $survivor->user_id]);
    }

    public function test_reset_journal_is_rejected_when_password_is_wrong(): void
    {
        $this->studentWithRecords();

        $this->actingAs($this->admin())
            ->delete('/monitoring/jurnal/reset', ['password' => 'salah'])
            ->assertSessionHasErrors('password');

        $this->assertDatabaseCount('activities', 1);
    }

    public function test_non_admin_cannot_reset_journal(): void
    {
        $this->studentWithRecords();

        foreach (['guru', 'kaprog', 'wakasek', 'pembimbing', 'siswa'] as $role) {
            $this->actingAs($this->user($role))
                ->delete('/monitoring/jurnal/reset', ['password' => self::PASSWORD])
                ->assertForbidden();
        }

        $this->assertDatabaseCount('activities', 1);
    }

    /**
     * INTI FASE INI. Fase 20 secara harfiah adalah menyalin Fase 19, dan satu
     * `class-string` yang lupa diganti akan menghapus modul yang salah tanpa
     * gejala apa pun sampai ada yang membuka Data Absen.
     */
    public function test_reset_journal_does_not_touch_attendances(): void
    {
        $this->studentWithRecords();
        $this->studentWithRecords();

        $this->assertDatabaseCount('activities', 2);
        $this->assertDatabaseCount('attendances', 2);

        $this->actingAs($this->admin())
            ->delete('/monitoring/jurnal/reset', ['password' => self::PASSWORD])
            ->assertRedirect();

        $this->assertDatabaseCount('activities', 0);
        $this->assertDatabaseCount('attendances', 2);
    }

    /** Kebalikannya: reset absen tidak boleh menyentuh jurnal. */
    public function test_reset_attendance_does_not_touch_journals(): void
    {
        $this->studentWithRecords();

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', ['password' => self::PASSWORD])
            ->assertRedirect();

        $this->assertDatabaseCount('attendances', 0);
        $this->assertDatabaseCount('activities', 1);
    }

    public function test_preview_count_matches_deleted_count(): void
    {
        $class = Classes::factory()->create();
        $this->studentWithRecords(['class_id' => $class->id]);
        $this->studentWithRecords(['class_id' => $class->id]);
        $this->studentWithRecords();

        $admin = $this->admin();

        $preview = $this->actingAs($admin)
            ->postJson('/monitoring/jurnal/reset/pratinjau', ['class_id' => $class->id])
            ->assertOk()
            ->json('count');

        $before = Activity::query()->count();

        $this->actingAs($admin)->delete('/monitoring/jurnal/reset', [
            'password' => self::PASSWORD,
            'class_id' => $class->id,
        ]);

        $this->assertSame($preview, $before - Activity::query()->count());
        $this->assertSame(2, $preview);
    }

    /**
     * Badge yang sudah diraih TIDAK dicabut (keputusan user) — BadgeAwarder
     * hanya bisa menambah, dan reset adalah operasi administratif.
     */
    public function test_reset_journal_does_not_revoke_earned_badges(): void
    {
        $student = $this->studentWithRecords();
        $badge = Badge::factory()->create();
        $student->badges()->attach($badge->id, ['awarded_at' => now()]);

        $this->actingAs($this->admin())
            ->delete('/monitoring/jurnal/reset', ['password' => self::PASSWORD])
            ->assertRedirect();

        $this->assertDatabaseCount('activities', 0);
        $this->assertDatabaseCount('student_badge', 1);
    }
}
