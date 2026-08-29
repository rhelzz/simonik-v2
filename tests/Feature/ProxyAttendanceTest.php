<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\BadgeSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * v2.4 Fase 24 — presensi yang diwakilkan guru pembimbing / admin.
 */
class ProxyAttendanceTest extends TestCase
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
     * Guru + industri + satu murid bimbingannya yang PKL-nya berjalan.
     *
     * @return array{teacher: User, student: Student, industry: Industry}
     */
    private function scenario(?string $jamMasuk = null): array
    {
        $teacherUser = $this->user('guru');
        $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);

        $pembimbing = Pembimbing::factory()->create([
            'user_id' => $this->user('pembimbing')->id,
        ]);

        $industry = Industry::factory()->create([
            'teacher_id' => $teacher->id,
            'pembimbing_id' => $pembimbing->id,
            'jam_masuk' => $jamMasuk,
        ]);

        $student = Student::factory()->create([
            'user_id' => $this->user('siswa')->id,
            'industri_id' => $industry->id,
            'status_pkl' => 'proses',
        ]);

        return ['teacher' => $teacherUser, 'student' => $student, 'industry' => $industry];
    }

    /** @param array<string, mixed> $overrides */
    private function payload(Student $student, array $overrides = []): array
    {
        return array_merge([
            'student_ids' => [$student->id],
            'date' => Carbon::now()->toDateString(),
            'arrival_time' => '08:00',
        ], $overrides);
    }

    public function test_guru_can_proxy_attendance_for_own_students(): void
    {
        $data = $this->scenario();

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student']))
            ->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'user_id' => $data['student']->user_id,
            'status' => 'hadir',
            'mode' => 'proxy',
            'arrivalTime' => '08:00:00',
        ]);
    }

    /**
     * KEAMANAN: ID murid di luar cakupan tidak pernah terambil scopedStudents(),
     * jadi payload yang ditulis tangan dari devtools menghasilkan 0 baris.
     */
    public function test_proxy_attendance_cannot_target_students_outside_scope(): void
    {
        $mine = $this->scenario();
        $other = $this->scenario();

        $this->actingAs($mine['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($other['student']))
            ->assertRedirect();

        $this->assertDatabaseMissing('attendances', [
            'user_id' => $other['student']->user_id,
        ]);
        $this->assertDatabaseCount('attendances', 0);
    }

    /**
     * INTI FASE INI: create(), bukan updateOrCreate(). Menimpa berarti
     * menghapus bukti foto & GPS absen mandiri siswa. Kalau seseorang
     * "menyederhanakan" jadi updateOrCreate, test inilah yang gagal.
     */
    public function test_proxy_attendance_skips_students_who_already_have_a_record(): void
    {
        $data = $this->scenario();
        $today = Carbon::now()->toDateString();

        $existing = Attendance::factory()->create([
            'user_id' => $data['student']->user_id,
            'date' => $today,
            'status' => 'sakit',
            'arrivalTime' => '07:15:00',
            'latitude' => '-6.914744',
            'mode' => 'wfo',
        ]);

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student']))
            ->assertRedirect();

        $existing->refresh();

        $this->assertSame('sakit', $existing->status);
        $this->assertSame('07:15:00', $existing->arrivalTime);
        $this->assertSame('-6.914744', $existing->latitude);
        $this->assertSame('wfo', $existing->mode);
        $this->assertDatabaseCount('attendances', 1);
    }

    /**
     * Keterlambatan tetap dihitung dari waktu yang diketik — kalau tidak,
     * presensi diwakilkan jadi jalan pintas menghapus keterlambatan.
     */
    public function test_proxy_attendance_marks_late_when_after_jam_masuk(): void
    {
        $data = $this->scenario('08:00:00');

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student'], [
                'arrival_time' => '09:30',
            ]))
            ->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'user_id' => $data['student']->user_id,
            'is_late' => true,
        ]);
    }

    public function test_proxy_attendance_is_not_late_when_before_jam_masuk(): void
    {
        $data = $this->scenario('08:00:00');

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student'], [
                'arrival_time' => '07:30',
            ]))
            ->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'user_id' => $data['student']->user_id,
            'is_late' => false,
        ]);
    }

    /**
     * Tanpa geolokasi & foto sesuai permintaan — dan koordinat industri TIDAK
     * diisikan sebagai "perkiraan", karena itu memalsukan bukti lokasi.
     */
    public function test_proxy_attendance_leaves_photo_and_gps_null(): void
    {
        $data = $this->scenario();

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student']))
            ->assertRedirect();

        $attendance = Attendance::query()
            ->where('user_id', $data['student']->user_id)
            ->firstOrFail();

        $this->assertNull($attendance->getRawOriginal('image'));
        $this->assertNull($attendance->latitude);
        $this->assertNull($attendance->longitude);
        $this->assertNull($attendance->gps_accuracy);
    }

    public function test_proxy_attendance_records_who_did_it(): void
    {
        $data = $this->scenario();

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student']))
            ->assertRedirect();

        $attendance = Attendance::query()
            ->where('user_id', $data['student']->user_id)
            ->firstOrFail();

        $this->assertStringContainsString('diwakilkan', (string) $attendance->description);
        $this->assertStringContainsString($data['teacher']->name, (string) $attendance->description);
    }

    public function test_siswa_cannot_call_proxy_attendance(): void
    {
        $data = $this->scenario();

        $this->actingAs($this->user('siswa'))
            ->post('/monitoring/absen/presensi', $this->payload($data['student']))
            ->assertForbidden();

        $this->assertDatabaseCount('attendances', 0);
    }

    public function test_pembimbing_can_proxy_attendance_for_own_students(): void
    {
        $data = $this->scenario();

        $this->actingAs(Pembimbing::findOrFail($data['industry']->pembimbing_id)->user)
            ->post('/monitoring/absen/presensi', $this->payload($data['student']))
            ->assertRedirect();

        $this->assertDatabaseHas('attendances', [
            'user_id' => $data['student']->user_id,
            'mode' => 'proxy',
        ]);
    }

    /**
     * Badge adalah penghargaan atas perilaku siswa; baris ini dibuat guru.
     * Memberi badge untuknya membuka jalan "minta guru presensikan saya biar
     * streak-nya aman".
     */
    public function test_proxy_attendance_does_not_award_badges(): void
    {
        $this->seed(BadgeSeeder::class);
        $data = $this->scenario();

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student']))
            ->assertRedirect();

        $this->assertDatabaseCount('student_badge', 0);
    }

    public function test_proxy_attendance_validates_time_format(): void
    {
        $data = $this->scenario();

        $this->actingAs($data['teacher'])
            ->post('/monitoring/absen/presensi', $this->payload($data['student'], [
                'arrival_time' => 'pagi',
            ]))
            ->assertSessionHasErrors('arrival_time');

        $this->assertDatabaseCount('attendances', 0);
    }
}
