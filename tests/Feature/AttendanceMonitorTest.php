<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AttendanceMonitorTest extends TestCase
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
     * 1 industri (guru + pembimbing), 1 siswa di jurusan+kelas tertentu, dengan
     * 1 catatan absen belum terverifikasi.
     *
     * @return array{teacher: User, pembimbing: User, student: Student, departemen: Departemen, class: Classes, attendance: Attendance}
     */
    private function scenario(): array
    {
        $teacherUser = $this->user('guru');
        $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);

        $pembimbingUser = $this->user('pembimbing');
        $pembimbing = Pembimbing::factory()->create(['user_id' => $pembimbingUser->id]);

        $industry = Industry::factory()->create([
            'teacher_id' => $teacher->id,
            'pembimbing_id' => $pembimbing->id,
        ]);

        $departemen = Departemen::factory()->create();
        $class = Classes::factory()->create(['departemen_id' => $departemen->id]);

        $studentUser = $this->user('siswa');
        $student = Student::factory()->create([
            'user_id' => $studentUser->id,
            'industri_id' => $industry->id,
            'departemen_id' => $departemen->id,
            'class_id' => $class->id,
        ]);

        $attendance = Attendance::factory()->create([
            'user_id' => $studentUser->id,
            'status' => 'hadir',
            'verified' => '0',
        ]);

        return [
            'teacher' => $teacherUser,
            'pembimbing' => $pembimbingUser,
            'student' => $student,
            'departemen' => $departemen,
            'class' => $class,
            'attendance' => $attendance,
        ];
    }

    /**
     * v2.4 Fase 22 — kartu Rate absensi memakai rumus yang sama dengan
     * dashboard (trait SummarizesParticipation).
     */
    public function test_monitor_index_includes_attendance_rate(): void
    {
        $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen')
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/index')
                ->has('attendanceRate.today')
                ->has('attendanceRate.week')
                ->has('attendanceRate.month')
                ->has('attendanceRate.all')
            );
    }

    /**
     * v2.4 Fase 22 — rate dibatasi cakupan role. Guru melihat rate MURIDNYA
     * (1 dari 1 hadir = 100%), bukan rate sekolah yang ikut menghitung siswa
     * aktif di luar bimbingannya yang tidak absen.
     */
    public function test_attendance_rate_is_scoped_to_the_teacher(): void
    {
        $data = $this->scenario();

        $data['student']->update(['status_pkl' => 'proses']);
        $data['attendance']->update(['date' => Carbon::now()->toDateString()]);

        // Siswa aktif di luar bimbingan guru, tanpa absen sama sekali.
        Student::factory()->count(3)->create(['status_pkl' => 'proses']);

        $this->actingAs($data['teacher'])
            ->get('/monitoring/absen')
            ->assertInertia(fn (Assert $page) => $page->where('attendanceRate.today', 100));

        // Admin melihat seluruh sekolah: 1 hadir dari 4 siswa aktif = 25%.
        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen')
            ->assertInertia(fn (Assert $page) => $page->where('attendanceRate.today', 25));
    }

    public function test_check_in_without_check_out_is_recorded_but_not_counted_present(): void
    {
        Carbon::setTestNow('2026-09-01 10:00:00');
        $data = $this->scenario();
        $data['student']->update(['status_pkl' => 'proses']);
        $data['attendance']->update([
            'date' => Carbon::today(),
            'arrivalTime' => '08:00:00',
            'departureTime' => null,
        ]);

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen?tab=sudah')
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.sudah', 1)
                ->where('attendanceRate.today', 0)
                ->where('roster.data.0.status', 'belum-lengkap')
                ->where('roster.data.0.statusLabel', 'Belum lengkap')
                ->where('roster.data.0.arrivalTime', '08:00')
                ->where('roster.data.0.departureTime', null)
            );

        Carbon::setTestNow();
    }

    public function test_late_minutes_are_visible_in_roster_and_scoped_student_detail(): void
    {
        $data = $this->scenario();
        $data['student']->update(['status_pkl' => 'proses']);
        $data['attendance']->update([
            'date' => Carbon::today(),
            'arrivalTime' => '08:17:00',
        ]);

        $this->actingAs($data['teacher'])
            ->get('/monitoring/absen?tab=sudah')
            ->assertInertia(fn (Assert $page) => $page
                ->where('roster.data.0.lateMinutes', 17)
            );

        $this->actingAs($data['teacher'])
            ->get("/monitoring/absen/murid/{$data['student']->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->where('records.data.0.lateMinutes', 17)
                ->where('performance.lateMinutes', 17)
            );
    }

    public function test_incomplete_historical_attendance_before_phase_31_remains_present(): void
    {
        $data = $this->scenario();
        $data['attendance']->update([
            'date' => '2026-08-28',
            'arrivalTime' => '08:00:00',
            'departureTime' => null,
        ]);

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/murid/{$data['student']->id}")
            ->assertInertia(fn (Assert $page) => $page
                ->where('performance.attendance.hadir', 1)
            );
    }

    /**
     * v2.4 Fase 23 — roster harian memisahkan yang sudah & belum presensi.
     * Yang "sudah" ditentukan oleh ADANYA baris absen pada tanggal itu.
     */
    public function test_daily_roster_separates_present_and_absent_students(): void
    {
        $data = $this->scenario();
        $today = Carbon::now()->toDateString();

        $data['student']->update(['status_pkl' => 'proses', 'name' => 'Ada Absen']);
        $data['attendance']->update(['date' => $today, 'status' => 'hadir']);

        $absent = Student::factory()->create([
            'status_pkl' => 'proses',
            'name' => 'Tanpa Absen',
        ]);

        $admin = $this->user('admin');

        $this->actingAs($admin)
            ->get('/monitoring/absen?tab=belum')
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 1)
                ->where('roster.data.0.id', $absent->id)
                ->where('roster.data.0.statusLabel', 'Belum presensi')
                ->where('summary.belum', 1)
                ->where('summary.sudah', 1)
            );

        $this->actingAs($admin)
            ->get('/monitoring/absen?tab=sudah')
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 1)
                ->where('roster.data.0.id', $data['student']->id)
                ->where('roster.data.0.statusLabel', 'Hadir')
                ->where('roster.data.0.departureTime', '16:00')
            );
    }

    /**
     * v2.4 Fase 23 — siswa sakit/izin/libur SUDAH punya baris absen, jadi
     * tidak boleh muncul di daftar "belum". Kalau ini rusak, siswa sakit
     * ber-approval lengkap akan dipresensikan paksa lewat Fase 24 dan
     * status sakitnya tertimpa.
     */
    public function test_students_with_sakit_status_count_as_present(): void
    {
        $data = $this->scenario();

        $data['student']->update(['status_pkl' => 'proses']);
        $data['attendance']->update([
            'date' => Carbon::now()->toDateString(),
            'status' => 'sakit',
        ]);

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen?tab=sudah')
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 1)
                ->where('roster.data.0.statusLabel', 'Sakit')
                ->where('summary.belum', 0)
            );
    }

    /**
     * v2.4 Fase 23 — hanya siswa PKL berjalan. Yang belum mulai / sudah
     * selesai memang tidak absen; memasukkannya akan mengubur nama yang
     * benar di bawah puluhan yang tidak relevan.
     */
    public function test_daily_roster_only_includes_active_pkl_students(): void
    {
        Student::factory()->create(['status_pkl' => 'belum']);
        Student::factory()->create(['status_pkl' => 'selesai']);
        $active = Student::factory()->create(['status_pkl' => 'proses']);

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen?tab=belum')
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 1)
                ->where('roster.data.0.id', $active->id)
            );
    }

    /**
     * v2.4 Fase 23 — KEAMANAN: guru hanya melihat murid bimbingannya.
     */
    public function test_daily_roster_is_scoped_to_the_teacher(): void
    {
        $data = $this->scenario();
        $data['student']->update(['status_pkl' => 'proses']);

        // Siswa sekolah lain, di luar bimbingan guru.
        Student::factory()->count(2)->create(['status_pkl' => 'proses']);

        $this->actingAs($data['teacher'])
            ->get('/monitoring/absen?tab=belum')
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 1)
                ->where('roster.data.0.id', $data['student']->id)
                ->where('summary.belum', 1)
            );
    }

    /**
     * v2.4 Fase 23 — absen kemarin tidak membuat siswa terhitung "sudah"
     * hari ini.
     */
    public function test_daily_roster_respects_selected_date(): void
    {
        $data = $this->scenario();
        $yesterday = Carbon::now()->subDay()->toDateString();

        $data['student']->update(['status_pkl' => 'proses']);
        $data['attendance']->update(['date' => $yesterday, 'status' => 'hadir']);

        $admin = $this->user('admin');

        // Hari ini: belum, karena absennya kemarin.
        $this->actingAs($admin)
            ->get('/monitoring/absen?tab=belum')
            ->assertInertia(fn (Assert $page) => $page->where('summary.belum', 1));

        // Kemarin: sudah.
        $this->actingAs($admin)
            ->get('/monitoring/absen?tab=sudah&tanggal='.$yesterday)
            ->assertInertia(fn (Assert $page) => $page
                ->where('summary.sudah', 1)
                ->where('summary.belum', 0)
                ->has('roster.data', 1)
            );
    }

    /**
     * v2.4 Fase 27 — murid tanpa data absen pada hari kerja yang sudah lewat
     * ditandai Alpha; hari BERJALAN tidak pernah Alpha.
     */
    public function test_past_date_labels_missing_students_as_alpha(): void
    {
        Carbon::setTestNow('2026-08-19'); // Rabu

        $data = $this->scenario();
        $data['student']->update([
            'status_pkl' => 'proses',
            'pkl_start' => null,
            'pkl_end' => null,
        ]);
        $data['attendance']->update(['date' => '2026-07-01']);

        $admin = $this->user('admin');

        // Selasa kemarin: tidak ada data → Alpha.
        $this->actingAs($admin)
            ->get('/monitoring/absen?tab=belum&tanggal=2026-08-18')
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 1)
                ->where('roster.data.0.status', 'alpha')
                ->where('roster.data.0.statusLabel', 'Alpha')
            );

        // Hari ini: belum presensi, BUKAN Alpha.
        $this->actingAs($admin)
            ->get('/monitoring/absen?tab=belum')
            ->assertInertia(fn (Assert $page) => $page
                ->where('roster.data.0.status', 'belum')
                ->where('roster.data.0.statusLabel', 'Belum presensi')
            );

        Carbon::setTestNow();
    }

    /**
     * v2.4 Fase 27 — akhir pekan yang sudah lewat tidak dihitung: tab "belum"
     * kosong, bukan berisi seluruh sekolah.
     */
    public function test_past_weekend_is_excluded_from_the_belum_tab(): void
    {
        Carbon::setTestNow('2026-08-19'); // Rabu

        $data = $this->scenario();
        $data['student']->update(['status_pkl' => 'proses']);
        $data['attendance']->update(['date' => '2026-07-01']);

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen?tab=belum&tanggal=2026-08-16') // Minggu
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 0)
                ->where('summary.belum', 0)
            );

        Carbon::setTestNow();
    }

    /**
     * v2.4 Fase 27 — status tersimpan selalu menang. Siswa sakit tidak boleh
     * berubah jadi Alpha hanya karena statusnya bukan 'hadir'.
     */
    public function test_recorded_sakit_is_never_shown_as_alpha(): void
    {
        Carbon::setTestNow('2026-08-19');

        $data = $this->scenario();
        $data['student']->update(['status_pkl' => 'proses']);
        $data['attendance']->update(['date' => '2026-08-18', 'status' => 'sakit']);

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen?tab=sudah&tanggal=2026-08-18')
            ->assertInertia(fn (Assert $page) => $page
                ->has('roster.data', 1)
                ->where('roster.data.0.status', 'sakit')
                ->where('roster.data.0.statusLabel', 'Sakit')
            );

        Carbon::setTestNow();
    }

    /**
     * v2.4 Fase 27 — INTI pilihan "Alpha turunan": koreksi terlambat
     * menghapus Alpha tanpa ada jalur pembersihan apa pun. Ini yang
     * membuktikan Alpha tidak perlu disimpan sebagai baris.
     */
    public function test_alpha_disappears_after_proxy_attendance_is_recorded(): void
    {
        Carbon::setTestNow('2026-08-19');

        $data = $this->scenario();
        $data['student']->update([
            'status_pkl' => 'proses',
            'pkl_start' => null,
            'pkl_end' => null,
        ]);
        $data['attendance']->update(['date' => '2026-07-01']);

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen?tab=belum&tanggal=2026-08-18')
            ->assertInertia(fn (Assert $page) => $page->where('roster.data.0.status', 'alpha'));

        // Guru menyusulkan presensi untuk tanggal itu (Fase 24).
        $this->actingAs($data['teacher'])->post('/monitoring/absen/presensi', [
            'student_ids' => [$data['student']->id],
            'date' => '2026-08-18',
            'arrival_time' => '08:00',
        ]);

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen?tab=belum&tanggal=2026-08-18')
            ->assertInertia(fn (Assert $page) => $page->has('roster.data', 0));

        Carbon::setTestNow();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/monitoring/absen')->assertRedirect('/login');
    }

    public function test_scope_label_states_whose_data_is_shown(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen')
            ->assertInertia(fn (Assert $page) => $page
                ->where('scopeLabel', 'Menampilkan seluruh siswa di sekolah.')
            );

        $this->actingAs($s['teacher'])
            ->get('/monitoring/absen')
            ->assertInertia(fn (Assert $page) => $page
                ->where('scopeLabel', 'Menampilkan hanya siswa di industri yang Anda bimbing.')
            );

        $this->actingAs($s['pembimbing'])
            ->get('/monitoring/absen')
            ->assertInertia(fn (Assert $page) => $page
                ->where('scopeLabel', 'Menampilkan hanya siswa yang magang di industri Anda.')
            );
    }

    public function test_wakasek_can_view_monitor(): void
    {
        $this->actingAs($this->user('wakasek'))
            ->get('/monitoring/absen')
            ->assertInertia(fn (Assert $page) => $page->component('attendance-monitor/index'));
    }

    public function test_siswa_cannot_access_monitor(): void
    {
        $this->actingAs($this->user('siswa'))
            ->get('/monitoring/absen')
            ->assertForbidden();
    }

    public function test_admin_sees_departemens_layer(): void
    {
        $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get('/monitoring/absen')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/index')
                ->has('departemens', 1)
                ->where('departemens.0.students', 1)
            );
    }

    public function test_classes_layer_lists_classes_with_students(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/jurusan/{$s['departemen']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/classes')
                ->has('classes', 1)
                ->where('classes.0.id', $s['class']->id)
            );
    }

    public function test_classes_layer_renders_empty_state_for_empty_departemen(): void
    {
        $this->scenario();
        $empty = Departemen::factory()->create();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/jurusan/{$empty->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/classes')
                ->has('classes', 0)
            );
    }

    public function test_students_layer_lists_students(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/kelas/{$s['class']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/students')
                ->has('students.data', 1)
                ->where('students.data.0.total', 1)
            );
    }

    public function test_show_layer_lists_records(): void
    {
        $s = $this->scenario();

        $this->actingAs($this->user('admin'))
            ->get("/monitoring/absen/murid/{$s['student']->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('attendance-monitor/show')
                ->has('records.data', 1)
                ->where('performance.attendance.hadir', 1)
                ->has('performance.attendanceRate')
            );
    }

    public function test_guru_cannot_view_student_outside_scope(): void
    {
        $this->scenario();
        $guru = $this->user('guru');
        Teacher::factory()->create(['user_id' => $guru->id]);

        $other = Student::factory()->create([
            'industri_id' => Industry::factory()->create()->id,
        ]);

        $this->actingAs($guru)
            ->get("/monitoring/absen/murid/{$other->id}")
            ->assertForbidden();
    }
}
