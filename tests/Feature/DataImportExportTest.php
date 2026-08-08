<?php

namespace Tests\Feature;

use App\Models\Departemen;
use App\Models\Pembimbing;
use App\Models\Teacher;
use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Maatwebsite\Excel\Facades\Excel;
use Tests\TestCase;

class DataImportExportTest extends TestCase
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

    private function csv(string $content): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('import.csv', $content);
    }

    public function test_all_entities_export_and_download_template(): void
    {
        Excel::fake();
        $admin = $this->admin();

        $entities = [
            'departemens', 'classes', 'wakaseks', 'kaprogs',
            'teachers', 'pembimbings', 'parents', 'industries',
        ];

        foreach ($entities as $slug) {
            $this->actingAs($admin)->get("/{$slug}/export")->assertOk();
            $this->actingAs($admin)->get("/{$slug}/template")->assertOk();
        }
    }

    public function test_import_jurusan_and_skip_existing(): void
    {
        Departemen::factory()->create(['name' => 'Teknik Mesin']);

        $csv = "Nama\nTeknik Mesin\nTeknik Elektro\n";

        $this->actingAs($this->admin())
            ->post('/departemens/import', ['file' => $this->csv($csv)])
            ->assertRedirect(route('departemens.index'));

        // Yang baru ditambah, yang sudah ada (Teknik Mesin) dilewati.
        $this->assertDatabaseHas('departemens', ['name' => 'Teknik Elektro']);
        $this->assertSame(1, Departemen::where('name', 'Teknik Mesin')->count());
    }

    public function test_import_kelas_resolves_jurusan_by_name(): void
    {
        $dep = Departemen::factory()->create(['name' => 'Teknik Mesin']);

        $csv = "Nama,Jurusan\nXII TM 1,Teknik Mesin\n";

        $this->actingAs($this->admin())
            ->post('/classes/import', ['file' => $this->csv($csv)])
            ->assertRedirect(route('classes.index'));

        $this->assertDatabaseHas('classes', ['name' => 'XII TM 1', 'departemen_id' => $dep->id]);
    }

    public function test_import_wakasek_creates_account_with_default_password(): void
    {
        $csv = "Nama,Email\nAndi Wijaya,andi@simonik.local\n";

        $this->actingAs($this->admin())
            ->post('/wakaseks/import', ['file' => $this->csv($csv)])
            ->assertRedirect(route('wakaseks.index'));

        $user = User::where('email', 'andi@simonik.local')->firstOrFail();
        $this->assertTrue($user->hasRole('wakasek'));
        $this->assertTrue(Hash::check('password', $user->password));
    }

    public function test_import_kaprog_links_departemen(): void
    {
        $dep = Departemen::factory()->create(['name' => 'Teknik Mesin']);

        $csv = "Nama,Email,Jurusan\nRina,rina@simonik.local,Teknik Mesin\n";

        $this->actingAs($this->admin())
            ->post('/kaprogs/import', ['file' => $this->csv($csv)]);

        $user = User::where('email', 'rina@simonik.local')->firstOrFail();
        $this->assertTrue($user->hasRole('kaprog'));
        $this->assertSame($user->id, $dep->refresh()->user_id);
    }

    public function test_import_teacher_creates_profile(): void
    {
        $dep = Departemen::factory()->create(['name' => 'Teknik Mesin']);

        $csv = "Nama,Email,No HP,Jurusan\nSiti Aminah,siti@simonik.local,081234567890,Teknik Mesin\n";

        $this->actingAs($this->admin())
            ->post('/teachers/import', ['file' => $this->csv($csv)]);

        $user = User::where('email', 'siti@simonik.local')->firstOrFail();
        $this->assertTrue($user->hasRole('guru'));
        $this->assertDatabaseHas('teachers', ['user_id' => $user->id, 'departemen_id' => $dep->id]);
    }

    public function test_import_pembimbing_and_parent_create_profiles(): void
    {
        $this->actingAs($this->admin())
            ->post('/pembimbings/import', ['file' => $this->csv(
                "Nama,Email,No HP,Jenis Kelamin\nBudi,budi@simonik.local,081200001111,Laki-laki\n"
            )]);

        $this->actingAs($this->admin())
            ->post('/parents/import', ['file' => $this->csv(
                "Nama,Email,Jenis Kelamin,Alamat,Pekerjaan,No HP\nSantoso,santoso@simonik.local,Laki-laki,Jl. A,Wiraswasta,081298765432\n"
            )]);

        $pembimbing = User::where('email', 'budi@simonik.local')->firstOrFail();
        $this->assertTrue($pembimbing->hasRole('pembimbing'));
        $this->assertDatabaseHas('pembimbings', ['user_id' => $pembimbing->id, 'gender' => 'L']);

        $parent = User::where('email', 'santoso@simonik.local')->firstOrFail();
        $this->assertTrue($parent->hasRole('orangtua'));
        $this->assertDatabaseHas('parents', ['user_id' => $parent->id, 'occupation' => 'Wiraswasta']);
    }

    public function test_import_industry_resolves_relations(): void
    {
        $teacher = Teacher::factory()->create(['name' => 'Pak Guru']);
        $pembimbing = Pembimbing::factory()->create(['name' => 'Bu Pembimbing']);

        $csv = "Nama,Bidang,Alamat,Longitude,Latitude,Radius,Jam Masuk,Jam Pulang,Durasi,Kuota,Guru Pembimbing,Pembimbing Industri\n"
            ."PT Maju Jaya,Teknologi Informasi,Jl. Industri 5,107.6,-6.9,150,08:00,16:00,6 bulan,10,Pak Guru,Bu Pembimbing\n";

        $this->actingAs($this->admin())
            ->post('/industries/import', ['file' => $this->csv($csv)])
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'name' => 'PT Maju Jaya',
            'teacher_id' => $teacher->id,
            'pembimbing_id' => $pembimbing->id,
            'radius' => 150,
        ]);
    }

    public function test_import_industry_accepts_row_without_coordinates(): void
    {
        $csv = "Nama,Bidang,Alamat,Longitude,Latitude\nPT Tanpa Koordinat,Konstruksi,Jl. Belum Disurvei 1,,\n";

        $this->actingAs($this->admin())
            ->post('/industries/import', ['file' => $this->csv($csv)])
            ->assertRedirect(route('industries.index'));

        $this->assertDatabaseHas('industries', [
            'name' => 'PT Tanpa Koordinat',
            'longitude' => null,
            'latitude' => null,
        ]);
    }

    public function test_import_reports_unknown_relation_without_creating(): void
    {
        $csv = "Nama,Jurusan\nXII TM 1,Jurusan Hantu\n";

        $this->actingAs($this->admin())
            ->post('/classes/import', ['file' => $this->csv($csv)])
            ->assertSessionHas('error');

        $this->assertDatabaseMissing('classes', ['name' => 'XII TM 1']);
    }
}
