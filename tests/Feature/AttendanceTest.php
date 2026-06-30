<?php

namespace Tests\Feature;

use App\Models\Attendance;
use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function siswa(): User
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');

        return $user;
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/absen')->assertRedirect('/login');
    }

    public function test_non_students_are_forbidden(): void
    {
        $guru = User::factory()->create();
        $guru->assignRole('guru');

        $this->actingAs($guru)->get('/absen')->assertForbidden();
    }

    public function test_student_can_view_attendance_page(): void
    {
        $this->actingAs($this->siswa())->get('/absen')->assertOk();
    }

    public function test_student_can_check_in_with_photo_and_location(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'gps_accuracy' => 15.0,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'status' => 'hadir',
        ]);

        $attendance = Attendance::firstOrFail();
        $this->assertTrue($attendance->date->isToday());
        $this->assertNotNull($attendance->arrivalTime);
        Storage::disk('public')->assertExists($attendance->getRawOriginal('image'));
    }

    public function test_check_in_requires_photo_and_location(): void
    {
        $this->actingAs($this->siswa())
            ->post('/absen/masuk', [])
            ->assertSessionHasErrors(['image', 'latitude', 'longitude', 'gps_accuracy']);
    }

    public function test_student_cannot_check_in_twice_in_one_day(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        Attendance::factory()->create([
            'user_id' => $siswa->id,
            'date' => Carbon::today()->toDateString(),
            'status' => 'hadir',
        ]);

        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.2',
                'longitude' => '106.8',
                'gps_accuracy' => 15.0,
            ])
            ->assertSessionHas('error');

        $this->assertDatabaseCount('attendances', 1);
    }

    public function test_student_can_check_out(): void
    {
        Storage::fake('public');

        $siswa = $this->siswa();
        $attendance = Attendance::factory()->create([
            'user_id' => $siswa->id,
            'date' => Carbon::today()->toDateString(),
            'status' => 'hadir',
            'departureTime' => null,
        ]);

        $this->actingAs($siswa)
            ->post('/absen/pulang', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'gps_accuracy' => 15.0,
            ])
            ->assertSessionHas('success');

        $this->assertNotNull($attendance->fresh()->departureTime);
    }

    public function test_check_out_requires_prior_check_in(): void
    {
        Storage::fake('public');

        $this->actingAs($this->siswa())
            ->post('/absen/pulang', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'gps_accuracy' => 15.0,
            ])
            ->assertSessionHas('error');
    }

    public function test_student_can_submit_an_absence(): void
    {
        $siswa = $this->siswa();

        $this->actingAs($siswa)
            ->post('/absen/izin', [
                'status' => 'sakit',
                'absenceReason' => 'Demam tinggi',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'status' => 'sakit',
            'absenceReason' => 'Demam tinggi',
        ]);
    }

    public function test_absence_requires_reason(): void
    {
        $this->actingAs($this->siswa())
            ->post('/absen/izin', ['status' => 'izin'])
            ->assertSessionHasErrors('absenceReason');
    }

    public function test_student_check_in_ontime_if_before_jam_masuk(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $industry = Industry::factory()->create([
            'jam_masuk' => '08:00:00',
            'jam_pulang' => '17:00:00',
            'radius' => 100,
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ]);
        Student::factory()->create([
            'user_id' => $siswa->id,
            'industri_id' => $industry->id,
        ]);

        Carbon::setTestNow(Carbon::today()->setTime(7, 55, 0));

        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'gps_accuracy' => 10.0,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'is_late' => false,
        ]);

        Carbon::setTestNow();
    }

    public function test_student_check_in_late_if_after_jam_masuk(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $industry = Industry::factory()->create([
            'jam_masuk' => '08:00:00',
            'jam_pulang' => '17:00:00',
            'radius' => 100,
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ]);
        Student::factory()->create([
            'user_id' => $siswa->id,
            'industri_id' => $industry->id,
        ]);

        Carbon::setTestNow(Carbon::today()->setTime(8, 5, 0));

        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'gps_accuracy' => 10.0,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'is_late' => true,
        ]);

        Carbon::setTestNow();
    }

    public function test_check_in_outside_radius_is_rejected(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $industry = Industry::factory()->create([
            'radius' => 100,
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ]);
        Student::factory()->create([
            'user_id' => $siswa->id,
            'industri_id' => $industry->id,
        ]);

        // Absen dari jarak yang sangat jauh (mis. bandung vs jakarta)
        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.914744',
                'longitude' => '107.609810',
                'gps_accuracy' => 10.0,
            ])
            ->assertSessionHasErrors(['latitude'])
            ->assertSessionHas('error');

        $this->assertDatabaseMissing('attendances', [
            'user_id' => $siswa->id,
        ]);
    }

    public function test_check_in_poor_gps_accuracy_is_rejected(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $industry = Industry::factory()->create([
            'radius' => 100,
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ]);
        Student::factory()->create([
            'user_id' => $siswa->id,
            'industri_id' => $industry->id,
        ]);

        // Akurasi 150 meter (batas tolak > 100)
        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'gps_accuracy' => 150.0,
            ])
            ->assertSessionHasErrors(['latitude'])
            ->assertSessionHas('error');

        $this->assertDatabaseMissing('attendances', [
            'user_id' => $siswa->id,
        ]);
    }

    public function test_check_in_mediocre_gps_accuracy_is_flagged_suspect(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $industry = Industry::factory()->create([
            'radius' => 100,
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ]);
        Student::factory()->create([
            'user_id' => $siswa->id,
            'industri_id' => $industry->id,
        ]);

        // Akurasi 60 meter (50 < gps_accuracy <= 100 -> disetujui tapi suspect)
        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.200000',
                'longitude' => '106.816666',
                'gps_accuracy' => 60.0,
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'user_id' => $siswa->id,
            'is_suspect' => true,
        ]);
    }

    public function test_check_in_unnatural_leap_is_flagged_suspect(): void
    {
        Storage::fake('public');
        $siswa = $this->siswa();

        $industry = Industry::factory()->create([
            'radius' => 500000, // radius besar agar geofencing lolos
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
        ]);
        Student::factory()->create([
            'user_id' => $siswa->id,
            'industri_id' => $industry->id,
        ]);

        // Buat record absensi kemarin/tadi pagi di Jakarta
        Attendance::factory()->create([
            'user_id' => $siswa->id,
            'date' => Carbon::today()->subDay()->toDateString(),
            'latitude' => '-6.200000',
            'longitude' => '106.816666',
            'created_at' => Carbon::now()->subHours(2),
        ]);

        // Absen di Bandung (jarak > 100km) dalam selang waktu 2 jam
        $this->actingAs($siswa)
            ->post('/absen/masuk', [
                'image' => UploadedFile::fake()->image('selfie.jpg'),
                'latitude' => '-6.914744',
                'longitude' => '107.609810',
                'gps_accuracy' => 10.0,
            ])
            ->assertSessionHas('success');

        // Harus masuk dengan status is_suspect = true karena lompatan jarak ekstrim dalam waktu singkat
        $attendance = Attendance::orderByDesc('id')->first();
        $this->assertTrue($attendance->is_suspect);
    }
}
