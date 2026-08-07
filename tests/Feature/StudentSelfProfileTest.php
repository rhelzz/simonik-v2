<?php

namespace Tests\Feature;

use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentSelfProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function siswaWithStudent(): Student
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');

        return Student::factory()->create([
            'user_id' => $user->id,
            'nis' => null,
            'placeOfBirth' => null,
            'dateOfBirth' => null,
            'gender' => null,
            'bloodType' => null,
            'alamat' => null,
        ]);
    }

    public function test_siswa_bisa_melengkapi_data_diri_sendiri(): void
    {
        $student = $this->siswaWithStudent();

        $this->actingAs($student->users)
            ->patch('/profile/data-diri', [
                'nis' => '2024001',
                'placeOfBirth' => 'Bandung',
                'dateOfBirth' => '2008-05-01',
                'gender' => 'L',
                'bloodType' => 'O',
                'alamat' => 'Jl. Mawar No. 1',
            ])
            ->assertSessionHas('success');

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'nis' => '2024001',
            'placeOfBirth' => 'Bandung',
            'gender' => 'L',
            'bloodType' => 'O',
            'alamat' => 'Jl. Mawar No. 1',
        ]);
    }

    public function test_siswa_boleh_menyimpan_sebagian_data_saja(): void
    {
        $student = $this->siswaWithStudent();

        $this->actingAs($student->users)
            ->patch('/profile/data-diri', [
                'nis' => '2024002',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'nis' => '2024002',
            'alamat' => null,
        ]);
    }

    public function test_siswa_tidak_bisa_mengubah_field_institusional_lewat_endpoint_ini(): void
    {
        $student = $this->siswaWithStudent();
        $originalClassId = $student->class_id;
        $originalStatusPkl = $student->status_pkl;

        $this->actingAs($student->users)
            ->patch('/profile/data-diri', [
                'nis' => '2024003',
                'class_id' => 999999,
                'status_pkl' => 'selesai',
            ])
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'class_id' => $originalClassId,
            'status_pkl' => $originalStatusPkl,
        ]);
    }

    public function test_guru_tanpa_data_siswa_ditolak(): void
    {
        $guru = User::factory()->create();
        $guru->assignRole('guru');

        $this->actingAs($guru)
            ->patch('/profile/data-diri', ['nis' => '2024004'])
            ->assertNotFound();
    }

    public function test_account_notice_muncul_untuk_siswa_dengan_profil_kosong(): void
    {
        $student = $this->siswaWithStudent();

        $response = $this->actingAs($student->users)->get('/dashboard');

        $response->assertInertia(fn ($page) => $page
            ->where('auth.accountNotice', fn (?string $notice) => $notice !== null && str_contains($notice, 'Lengkapi data diri'))
        );
    }

    public function test_account_notice_hilang_setelah_profil_lengkap(): void
    {
        $student = $this->siswaWithStudent();
        $student->update([
            'nis' => '2024005',
            'placeOfBirth' => 'Bandung',
            'dateOfBirth' => '2008-05-01',
            'gender' => 'L',
            'alamat' => 'Jl. Mawar No. 1',
        ]);

        $response = $this->actingAs($student->users)->get('/dashboard');

        $response->assertInertia(fn ($page) => $page
            ->where('auth.accountNotice', null)
        );
    }
}
