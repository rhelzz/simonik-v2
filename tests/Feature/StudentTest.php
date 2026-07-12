<?php

namespace Tests\Feature;

use App\Exports\StudentsExport;
use App\Exports\StudentsTemplateExport;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Student;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Excel as ExcelFormat;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class StudentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
    }

    private function admin(): User
    {
        $user = User::factory()->create();
        $user->assignRole('admin');

        return $user;
    }

    /**
     * @return array<string, mixed>
     */
    private function validPayload(): array
    {
        $departemen = Departemen::factory()->create();

        return [
            'name' => 'Budi Santoso',
            'email' => 'budi@simonik.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'nis' => '2024001',
            'placeOfBirth' => 'Bandung',
            'dateOfBirth' => '2008-05-01',
            'gender' => 'L',
            'bloodType' => 'O',
            'alamat' => 'Jl. Mawar No. 1',
            'status_pkl' => 'belum',
            'class_id' => Classes::factory()->create(['departemen_id' => $departemen->id])->id,
            'industri_id' => Industry::factory()->create()->id,
            'departemen_id' => $departemen->id,
            'parent_id' => Parents::factory()->create()->id,
        ];
    }

    public function test_guests_are_redirected_to_login(): void
    {
        $this->get('/students')->assertRedirect('/login');
    }

    public function test_students_without_permission_are_forbidden(): void
    {
        $siswa = User::factory()->create();
        $siswa->assignRole('siswa');

        $this->actingAs($siswa)->get('/students')->assertForbidden();
    }

    public function test_admin_can_view_student_list(): void
    {
        $this->actingAs($this->admin())->get('/students')->assertOk();
    }

    public function test_admin_can_create_a_student_with_account(): void
    {
        $payload = $this->validPayload();

        $this->actingAs($this->admin())
            ->post('/students', $payload)
            ->assertRedirect(route('students.index'));

        $this->assertDatabaseHas('students', [
            'nis' => '2024001',
            'name' => 'Budi Santoso',
        ]);
        $this->assertDatabaseHas('users', ['email' => 'budi@simonik.test']);

        $user = User::where('email', 'budi@simonik.test')->firstOrFail();
        $this->assertTrue($user->hasRole('siswa'));
    }

    public function test_admin_can_update_a_student(): void
    {
        $student = Student::factory()->create();

        $payload = [
            'name' => 'Nama Baru',
            'email' => 'baru@simonik.test',
            'nis' => $student->nis,
            'placeOfBirth' => $student->placeOfBirth,
            'dateOfBirth' => $student->dateOfBirth->format('Y-m-d'),
            'gender' => 'P',
            'bloodType' => 'A',
            'alamat' => $student->alamat,
            'status_pkl' => 'proses',
            'class_id' => $student->class_id,
            'industri_id' => $student->industri_id,
            'departemen_id' => $student->departemen_id,
            'parent_id' => $student->parent_id,
        ];

        $this->actingAs($this->admin())
            ->put("/students/{$student->id}", $payload)
            ->assertRedirect(route('students.index'));

        $this->assertDatabaseHas('students', [
            'id' => $student->id,
            'name' => 'Nama Baru',
            'status_pkl' => 'proses',
        ]);
        $this->assertDatabaseHas('users', [
            'id' => $student->user_id,
            'email' => 'baru@simonik.test',
        ]);
    }

    public function test_admin_can_delete_a_student_and_its_account(): void
    {
        $student = Student::factory()->create();
        $userId = $student->user_id;

        $this->actingAs($this->admin())
            ->delete("/students/{$student->id}")
            ->assertRedirect(route('students.index'));

        $this->assertDatabaseMissing('students', ['id' => $student->id]);
        $this->assertDatabaseMissing('users', ['id' => $userId]);
    }

    public function test_admin_can_export_and_download_template(): void
    {
        Excel::fake();

        $this->actingAs($this->admin())->get('/students/export')->assertOk();
        Excel::assertDownloaded('data-siswa.xlsx');

        $this->actingAs($this->admin())->get('/students/template')->assertOk();
        Excel::assertDownloaded('template-impor-siswa.xlsx');
    }

    public function test_admin_can_import_students_with_default_password(): void
    {
        $departemen = Departemen::factory()->create(['name' => 'Rekayasa Perangkat Lunak']);
        $class = Classes::factory()->create(['name' => 'XI RPL 1', 'departemen_id' => $departemen->id]);
        $industry = Industry::factory()->create(['name' => 'PT Contoh Industri']);
        $parent = Parents::factory()->create(['nama' => 'Bapak Santoso']);

        $csv = "Nama,NIS,Email,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Golongan Darah,Alamat,Kelas,Jurusan,Industri,Orang Tua,Status PKL,PKL Mulai,PKL Selesai,Periode\n"
            ."Budi Santoso,0012345678,budi@contoh.sch.id,Laki-laki,Bandung,2008-05-14,O,Jl. Merdeka No. 1,{$class->name},{$departemen->name},{$industry->name},{$parent->nama},Belum,,,\n";

        $file = UploadedFile::fake()->createWithContent('import.csv', $csv);

        $this->actingAs($this->admin())
            ->post('/students/import', ['file' => $file])
            ->assertRedirect(route('students.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseHas('students', [
            'nis' => '0012345678',
            'class_id' => $class->id,
            'industri_id' => $industry->id,
        ]);

        $user = User::where('email', 'budi@contoh.sch.id')->firstOrFail();
        $this->assertTrue($user->hasRole('siswa'));
        $this->assertTrue(Hash::check('password', $user->password));
    }

    public function test_import_rejects_unknown_relation_and_saves_nothing(): void
    {
        Classes::factory()->create(['name' => 'XI RPL 1']);

        $csv = "Nama,NIS,Email,Jenis Kelamin,Tempat Lahir,Tanggal Lahir,Golongan Darah,Alamat,Kelas,Jurusan,Industri,Orang Tua,Status PKL,PKL Mulai,PKL Selesai,Periode\n"
            .'Siti,0022,siti@contoh.sch.id,Perempuan,Bogor,2008-01-01,A,Jl. Melati,Kelas Tidak Ada,Jurusan Hantu,Industri Fiktif,Wali Fiktif,Belum,,,'."\n";

        $file = UploadedFile::fake()->createWithContent('import.csv', $csv);

        $this->actingAs($this->admin())
            ->post('/students/import', ['file' => $file])
            ->assertSessionHasErrors();

        $this->assertDatabaseMissing('users', ['email' => 'siti@contoh.sch.id']);
    }

    public function test_export_maps_gender_and_status_to_readable_labels(): void
    {
        $student = Student::factory()->create(['gender' => 'L', 'status_pkl' => 'proses']);

        $row = (new StudentsExport)->map($student);

        $this->assertContains('Laki-laki', $row);
        $this->assertContains('Proses', $row);
    }

    public function test_styled_export_and_template_render_to_bytes(): void
    {
        Student::factory()->create();

        // Merender xlsx sungguhan (bukan Excel::fake) sehingga styling & event
        // AfterSheet ikut dijalankan — memastikan tak ada galat saat generate.
        $export = Excel::raw(new StudentsExport, ExcelFormat::XLSX);
        $template = Excel::raw(new StudentsTemplateExport, ExcelFormat::XLSX);

        $this->assertNotEmpty($export);
        $this->assertNotEmpty($template);
    }
}
