<?php

namespace Tests\Feature;

use App\Models\Approval;
use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * v2.4 Fase 19 — reset data absen. DESTRUKTIF: setiap test di sini menjaga
 * satu cara fitur ini bisa menghapus hal yang salah.
 */
class ResetAttendanceTest extends TestCase
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
     * Siswa + satu baris absen pada tanggal tertentu.
     */
    private function studentWithAttendance(array $studentAttributes = [], string $date = '2026-08-10'): Student
    {
        $student = Student::factory()->create(array_merge([
            'user_id' => $this->user('siswa')->id,
        ], $studentAttributes));

        Attendance::factory()->create([
            'user_id' => $student->user_id,
            'date' => $date,
            'status' => 'hadir',
        ]);

        return $student;
    }

    public function test_admin_can_reset_attendance_by_departemen(): void
    {
        $target = Departemen::factory()->create();
        $other = Departemen::factory()->create();

        $this->studentWithAttendance(['departemen_id' => $target->id]);
        $survivor = $this->studentWithAttendance(['departemen_id' => $other->id]);

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [
                'password' => self::PASSWORD,
                'departemen_id' => $target->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['user_id' => $survivor->user_id]);
    }

    public function test_admin_can_reset_attendance_by_class(): void
    {
        $target = Classes::factory()->create();
        $other = Classes::factory()->create();

        $this->studentWithAttendance(['class_id' => $target->id]);
        $survivor = $this->studentWithAttendance(['class_id' => $other->id]);

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [
                'password' => self::PASSWORD,
                'class_id' => $target->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['user_id' => $survivor->user_id]);
    }

    public function test_admin_can_reset_attendance_by_industry(): void
    {
        $target = Industry::factory()->create();
        $other = Industry::factory()->create();

        $this->studentWithAttendance(['industri_id' => $target->id]);
        $survivor = $this->studentWithAttendance(['industri_id' => $other->id]);

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [
                'password' => self::PASSWORD,
                'industri_id' => $target->id,
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['user_id' => $survivor->user_id]);
    }

    /**
     * Rentang tanggal inklusif di kedua ujung; hari di luar rentang selamat.
     */
    public function test_admin_can_reset_attendance_by_date_range(): void
    {
        $student = $this->studentWithAttendance([], '2026-08-10');

        Attendance::factory()->create([
            'user_id' => $student->user_id,
            'date' => '2026-08-12',
            'status' => 'hadir',
        ]);
        Attendance::factory()->create([
            'user_id' => $student->user_id,
            'date' => '2026-08-20',
            'status' => 'hadir',
        ]);

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [
                'password' => self::PASSWORD,
                'from' => '2026-08-10',
                'to' => '2026-08-12',
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['date' => '2026-08-20 00:00:00']);
    }

    public function test_admin_can_reset_attendance_for_selected_students_only(): void
    {
        $target = $this->studentWithAttendance();
        $survivor = $this->studentWithAttendance();

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [
                'password' => self::PASSWORD,
                'student_ids' => [$target->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('attendances', 1);
        $this->assertDatabaseHas('attendances', ['user_id' => $survivor->user_id]);
    }

    /**
     * Password salah tidak boleh menghapus SATU baris pun.
     */
    public function test_reset_is_rejected_when_password_is_wrong(): void
    {
        $this->studentWithAttendance();

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [
                'password' => 'password-yang-salah',
            ])
            ->assertSessionHasErrors('password');

        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_reset_requires_a_password(): void
    {
        $this->studentWithAttendance();

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [])
            ->assertSessionHasErrors('password');

        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_non_admin_cannot_reset_attendance(): void
    {
        $this->studentWithAttendance();

        foreach (['guru', 'kaprog', 'wakasek', 'pembimbing', 'siswa'] as $role) {
            $this->actingAs($this->user($role))
                ->delete('/monitoring/absen/reset', ['password' => self::PASSWORD])
                ->assertForbidden();
        }

        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_non_admin_cannot_preview_reset(): void
    {
        $this->actingAs($this->user('guru'))
            ->post('/monitoring/absen/reset/pratinjau', [])
            ->assertForbidden();
    }

    /**
     * INTI: Approval bersifat polimorfik dan TIDAK punya foreign key ke
     * attendances — database tidak melakukan cascade apa pun. Approval yatim
     * membuat ApprovalController::index() fatal saat memanggil
     * $approvable->users->name pada approvable yang sudah null.
     */
    public function test_reset_also_deletes_related_approvals(): void
    {
        $student = $this->studentWithAttendance();
        $attendance = Attendance::query()->where('user_id', $student->user_id)->firstOrFail();

        Approval::initiate($attendance);

        // Approval milik absen siswa lain harus selamat.
        $survivorStudent = $this->studentWithAttendance();
        $survivorAttendance = Attendance::query()
            ->where('user_id', $survivorStudent->user_id)
            ->firstOrFail();
        $survivorApproval = Approval::initiate($survivorAttendance);

        $this->assertDatabaseCount('approvals', 2);

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', [
                'password' => self::PASSWORD,
                'student_ids' => [$student->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseMissing('approvals', [
            'approvable_type' => Attendance::class,
            'approvable_id' => $attendance->id,
        ]);
        $this->assertDatabaseHas('approvals', ['id' => $survivorApproval->id]);
    }

    /**
     * Pratinjau dan penghapusan WAJIB memakai himpunan yang sama — pratinjau
     * yang menghitung hal berbeda dari yang dihapus adalah bug paling
     * berbahaya di fitur ini.
     */
    public function test_preview_count_matches_deleted_count(): void
    {
        $departemen = Departemen::factory()->create();
        $this->studentWithAttendance(['departemen_id' => $departemen->id]);
        $this->studentWithAttendance(['departemen_id' => $departemen->id]);
        $this->studentWithAttendance(); // di luar kriteria

        $admin = $this->admin();

        $preview = $this->actingAs($admin)
            ->postJson('/monitoring/absen/reset/pratinjau', [
                'departemen_id' => $departemen->id,
            ])
            ->assertOk()
            ->json('count');

        $before = Attendance::query()->count();

        $this->actingAs($admin)->delete('/monitoring/absen/reset', [
            'password' => self::PASSWORD,
            'departemen_id' => $departemen->id,
        ]);

        $this->assertSame($preview, $before - Attendance::query()->count());
        $this->assertSame(2, $preview);
    }

    /**
     * Semua kriteria kosong = hapus seluruh data absen dalam cakupan. Ini SAH
     * ("reset dari awal") dan justru gunanya pratinjau — tapi harus terbukti
     * bekerja, bukan diam-diam menghapus 0 baris.
     */
    public function test_empty_criteria_resets_everything_in_scope(): void
    {
        $this->studentWithAttendance();
        $this->studentWithAttendance();

        $this->actingAs($this->admin())
            ->delete('/monitoring/absen/reset', ['password' => self::PASSWORD])
            ->assertRedirect();

        $this->assertDatabaseCount('attendances', 0);
    }

    /**
     * Butir permintaan "bisa diatur berdasarkan beberapa murid" hanya berarti
     * kalau operator BISA MELIHAT daftar muridnya di modal. Backend yang
     * menerima student_ids tapi tidak pernah menawarkan kandidat = fitur yang
     * tidak terjangkau dari layar.
     */
    public function test_preview_offers_student_candidates_for_the_modal(): void
    {
        $departemen = Departemen::factory()->create();
        $mine = $this->studentWithAttendance(['departemen_id' => $departemen->id]);
        $this->studentWithAttendance(); // jurusan lain

        $this->actingAs($this->admin())
            ->postJson('/monitoring/absen/reset/pratinjau', [
                'departemen_id' => $departemen->id,
            ])
            ->assertOk()
            ->assertJsonCount(1, 'students')
            ->assertJsonPath('students.0.id', $mine->id)
            ->assertJsonPath('truncated', false);
    }

    /**
     * Daftar kandidat DIABAIKAN oleh student_ids: kalau tidak, daftarnya
     * menyusut sendiri setiap kali operator mencentang seorang murid dan
     * pilihan tidak bisa dibatalkan lagi.
     */
    public function test_candidate_list_ignores_the_current_student_selection(): void
    {
        $departemen = Departemen::factory()->create();
        $a = $this->studentWithAttendance(['departemen_id' => $departemen->id]);
        $this->studentWithAttendance(['departemen_id' => $departemen->id]);

        $this->actingAs($this->admin())
            ->postJson('/monitoring/absen/reset/pratinjau', [
                'departemen_id' => $departemen->id,
                'student_ids' => [$a->id],
            ])
            ->assertOk()
            // Kandidat tetap 2 …
            ->assertJsonCount(2, 'students')
            // … tapi yang akan terhapus hanya milik murid yang dicentang.
            ->assertJsonPath('count', 1);
    }
}
