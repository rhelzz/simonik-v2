<?php

namespace Tests\Feature;

use App\Models\Attendance;
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
            ->assertSessionHasErrors(['image', 'latitude', 'longitude']);
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
}
