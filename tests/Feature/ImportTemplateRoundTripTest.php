<?php

namespace Tests\Feature;

use App\Exports\StudentsTemplateExport;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\User;
use App\Support\ImportTemplates;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Facades\Excel;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use Tests\TestCase;

/**
 * Template impor adalah workbook multi-sheet (Petunjuk / data / Referensi),
 * sedangkan importer hanya boleh membaca sheet datanya. Test di sini menempuh
 * jalur yang sama dengan operator — unduh template, isi, unggah — karena bug
 * justru terjadi *di antara* export dan import: memanggil importer dengan array
 * buatan tidak akan pernah menangkapnya (dan itulah sebabnya test impor lama
 * yang memakai CSV selalu hijau meski impor .xlsx tidak pernah bisa berhasil).
 */
class ImportTemplateRoundTripTest extends TestCase
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

    /** Tulis template ke berkas sementara lalu kembalikan path-nya. */
    private function writeTemplate(object $export): string
    {
        $path = tempnam(sys_get_temp_dir(), 'tpl').'.xlsx';
        file_put_contents($path, Excel::raw($export, \Maatwebsite\Excel\Excel::XLSX));

        return $path;
    }

    /**
     * Isi sheet data pada template dengan baris yang diberikan, lalu kembalikan
     * berkas siap unggah. Sheet Petunjuk & Referensi sengaja dibiarkan utuh —
     * di situlah letak bugnya.
     *
     * @param  array<int, array<int, string>>  $rows
     */
    private function fill(string $path, string $sheet, array $rows): UploadedFile
    {
        $spreadsheet = IOFactory::load($path);
        $worksheet = $spreadsheet->getSheetByName($sheet);
        $this->assertNotNull($worksheet, "Template tidak punya sheet \"{$sheet}\".");

        foreach ($rows as $i => $row) {
            $worksheet->fromArray($row, null, 'A'.($i + 2));
        }

        $out = tempnam(sys_get_temp_dir(), 'imp').'.xlsx';
        (new XlsxWriter($spreadsheet))->save($out);

        return new UploadedFile($out, 'impor.xlsx', null, null, true);
    }

    public function test_template_siswa_dapat_langsung_diimpor(): void
    {
        $departemen = Departemen::factory()->create(['name' => 'Rekayasa Perangkat Lunak']);
        $class = Classes::factory()->create(['name' => 'XI RPL 1', 'departemen_id' => $departemen->id]);

        $file = $this->fill(
            $this->writeTemplate(new StudentsTemplateExport),
            'Data Siswa',
            [
                ['Budi Santoso', '0012345678', 'budi@simonik.local', 'Laki-laki', 'Bandung', '2008-05-14', 'O', 'Jl. Merdeka No. 1', $class->name, $departemen->name],
                ['Siti Aminah', '0012345679', 'siti@simonik.local', 'Perempuan', 'Bogor', '2008-01-02', 'A', 'Jl. Melati No. 2', $class->name, $departemen->name],
            ],
        );

        $this->actingAs($this->admin())
            ->post('/students/import', ['file' => $file])
            ->assertRedirect(route('students.index'))
            ->assertSessionHas('success');

        $this->assertDatabaseCount('students', 2);
        $this->assertDatabaseHas('students', ['nis' => '0012345678', 'class_id' => $class->id]);
    }

    public function test_sheet_petunjuk_dan_referensi_tidak_ikut_terbaca(): void
    {
        // Template diunggah apa adanya: tidak ada satu pun baris data diisi.
        // Sebelum perbaikan, sheet "Petunjuk" & "Referensi" ikut terbaca sebagai
        // data dan menghasilkan belasan galat palsu per baris.
        $path = $this->writeTemplate(new StudentsTemplateExport);
        $file = new UploadedFile($path, 'impor.xlsx', null, null, true);

        $response = $this->actingAs($this->admin())
            ->post('/students/import', ['file' => $file])
            ->assertSessionHasNoErrors();

        // Berkas kosong memang dilaporkan ("tidak ada baris terbaca"), tapi
        // tidak boleh ada satu pun galat per-baris dari sheet non-data.
        $this->assertStringNotContainsString('Baris', (string) $response->getSession()->get('error'));
        $this->assertDatabaseCount('students', 0);
    }

    public function test_baris_contoh_tidak_ikut_tersimpan(): void
    {
        $file = $this->fill(
            $this->writeTemplate(new StudentsTemplateExport),
            'Data Siswa',
            [['Ani Lestari', '444', 'ani.lestari@simonik.local']],
        );

        $this->actingAs($this->admin())->post('/students/import', ['file' => $file]);

        $this->assertDatabaseHas('students', ['name' => 'Ani Lestari']);
        $this->assertDatabaseMissing('users', ['email' => 'budi@contoh.sch.id']);
        $this->assertDatabaseCount('students', 1);
    }

    public function test_template_pembimbing_dapat_langsung_diimpor(): void
    {
        $file = $this->fill(
            $this->writeTemplate(ImportTemplates::pembimbing()),
            'Data Pembimbing',
            [['Budi Hartono', 'budi.hartono@simonik.local', '081200001111', 'Laki-laki']],
        );

        $this->actingAs($this->admin())
            ->post('/pembimbings/import', ['file' => $file])
            ->assertSessionHas('success')
            ->assertSessionMissing('error');

        $this->assertDatabaseHas('pembimbings', ['name' => 'Budi Hartono']);
    }

    public function test_baris_invalid_tidak_membatalkan_baris_valid(): void
    {
        $file = $this->fill(
            $this->writeTemplate(new StudentsTemplateExport),
            'Data Siswa',
            [
                ['Ani', '111', 'ani@simonik.local'],
                ['Tanpa Email', '222', ''],
                ['Rudi', '333', 'rudi@simonik.local'],
            ],
        );

        $response = $this->actingAs($this->admin())->post('/students/import', ['file' => $file]);

        $response->assertSessionHas('success');
        $response->assertSessionHas('error'); // rincian baris yang gagal

        $this->assertDatabaseCount('students', 2);
        $this->assertDatabaseMissing('students', ['name' => 'Tanpa Email']);
    }

    public function test_berkas_tanpa_sheet_data_menjelaskan_sebabnya(): void
    {
        $spreadsheet = new Spreadsheet;
        $spreadsheet->getActiveSheet()->setTitle('Sheet Karangan');
        $spreadsheet->getActiveSheet()->fromArray([['Nama', 'Email'], ['Ani', 'ani@simonik.local']]);

        $path = tempnam(sys_get_temp_dir(), 'aneh').'.xlsx';
        (new XlsxWriter($spreadsheet))->save($path);

        $this->actingAs($this->admin())
            ->post('/students/import', ['file' => new UploadedFile($path, 'aneh.xlsx', null, null, true)])
            ->assertSessionHas('error', fn (string $message): bool => str_contains($message, 'Data Siswa'));

        $this->assertDatabaseCount('students', 0);
    }
}
