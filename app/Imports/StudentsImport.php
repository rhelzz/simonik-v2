<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Student;
use App\Support\ImportDefaults;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsUnknownSheets;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Impor data siswa dari Excel. Relasi (kelas/jurusan/industri/orang tua) diisi
 * dengan NAMA lalu di-resolve ke id; nama yang tak dikenal dikosongkan dan
 * dicatat sebagai peringatan, bukan menggagalkan baris. Setiap siswa dibuatkan
 * akun login ber-role `siswa` dengan kata sandi default "password".
 *
 * Seperti importer lain: baris tak valid dicatat sebagai gagal, email yang
 * sudah terdaftar dilewati, dan sisanya tetap diimpor.
 */
class StudentsImport implements SkipsEmptyRows, SkipsUnknownSheets, ToCollection, WithHeadingRow, WithMultipleSheets
{
    use ImportsRows;

    public function sheetName(): string
    {
        return ImportDefaults::SHEETS['siswa'];
    }

    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        // Peta nama (huruf kecil) -> id untuk resolusi relasi tanpa query per-baris.
        $classes = $this->lookup(Classes::query()->pluck('id', 'name'));
        $departemens = $this->lookup(Departemen::query()->pluck('id', 'name'));
        $industries = $this->lookup(Industry::query()->pluck('id', 'name'));
        $parents = $this->lookup(Parents::query()->pluck('id', 'nama'));

        $existing = $this->existingEmails();
        $existingNis = Student::query()->pluck('nis')->map(fn ($n) => (string) $n)->all();

        $seen = [];
        $seenNis = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2; // baris 1 = judul kolom
            $get = fn (string $key): string => trim((string) ($row[$key] ?? ''));

            $name = $get('nama');
            $email = mb_strtolower($get('email'));
            $nis = $get('nis');
            $gender = $this->gender($get('jenis_kelamin'));
            // "-" dipakai untuk siswa yang tidak tahu golongan darahnya.
            $bloodType = $this->nullify(mb_strtoupper($get('golongan_darah')));
            $status = $this->status($get('status_pkl'));
            $dob = $this->date($row['tanggal_lahir'] ?? null);

            $classId = $classes[mb_strtolower($get('kelas'))] ?? null;
            $departemenId = $departemens[mb_strtolower($get('jurusan'))] ?? null;
            $industriId = $industries[mb_strtolower($get('industri'))] ?? null;
            $parentId = $parents[mb_strtolower($get('orang_tua'))] ?? null;

            if ($name === '' || $email === '') {
                $this->fail($line, 'Nama dan Email wajib diisi.');

                continue;
            }

            if (! $this->isEmail($email)) {
                $this->fail($line, "Email \"{$email}\" tidak valid.");

                continue;
            }

            if ($get('jenis_kelamin') !== '' && $gender === null) {
                $this->fail($line, 'Jenis Kelamin harus "Laki-laki"/"L" atau "Perempuan"/"P".');

                continue;
            }

            if ($status === null) {
                $this->fail($line, 'Status PKL harus Belum, Proses, atau Selesai.');

                continue;
            }

            if ($get('tanggal_lahir') !== '' && $dob === null) {
                $this->fail($line, 'Tanggal Lahir tidak valid (gunakan format YYYY-MM-DD).');

                continue;
            }

            $validator = Validator::make(
                [
                    'golongan_darah' => $bloodType,
                    'pkl_mulai' => $this->date($row['pkl_mulai'] ?? null),
                    'pkl_selesai' => $this->date($row['pkl_selesai'] ?? null),
                ],
                [
                    // Hanya nama & email yang wajib — sisanya dilengkapi siswa
                    // sendiri setelah login.
                    'golongan_darah' => ['nullable', 'in:A,B,AB,O'],
                    'pkl_selesai' => ['nullable', 'date', 'after_or_equal:pkl_mulai'],
                ],
            );

            if ($validator->fails()) {
                $this->fail($line, implode(' ', $validator->errors()->all()));

                continue;
            }

            if (in_array($email, $existing, true) || in_array($email, $seen, true)) {
                $this->skip($line, "Email {$email} sudah terdaftar.");

                continue;
            }

            if ($nis !== '' && (in_array($nis, $existingNis, true) || in_array($nis, $seenNis, true))) {
                $this->skip($line, "NIS {$nis} sudah terdaftar.");

                continue;
            }

            // Relasi tidak wajib: bila namanya tak dikenal, dikosongkan dan
            // dicatat sebagai peringatan — impor tetap jalan, siswa melengkapi
            // sendiri setelah login.
            $this->noteRef($line, 'Kelas', $get('kelas'), $classId);
            $this->noteRef($line, 'Jurusan', $get('jurusan'), $departemenId);
            $this->noteRef($line, 'Industri', $get('industri'), $industriId);
            $this->noteRef($line, 'Orang Tua', $get('orang_tua'), $parentId);

            $user = $this->makeUser($name, $email, 'siswa');

            Student::create([
                'user_id' => $user->id,
                'name' => $name,
                'nis' => $this->nullify($nis),
                'placeOfBirth' => $this->nullify($get('tempat_lahir')),
                'dateOfBirth' => $dob,
                'gender' => $gender,
                'bloodType' => $bloodType,
                'alamat' => $this->nullify($get('alamat')),
                'status_pkl' => $status,
                'pkl_start' => $this->date($row['pkl_mulai'] ?? null),
                'pkl_end' => $this->date($row['pkl_selesai'] ?? null),
                'class_id' => $classId,
                'industri_id' => $industriId,
                'departemen_id' => $departemenId,
                'parent_id' => $parentId,
            ]);

            $seen[] = $email;

            if ($nis !== '') {
                $seenNis[] = $nis;
            }

            $this->created++;
        }
    }

    /** Teks kosong / "-" dianggap belum diisi. */
    private function nullify(string $value): ?string
    {
        return ($value === '' || $value === '-') ? null : $value;
    }

    /**
     * Catat peringatan bila relasi diisi tapi namanya tak dikenal. Tidak
     * menggagalkan impor — kolomnya sekadar dibiarkan kosong.
     */
    private function noteRef(int $line, string $label, string $value, ?int $resolved): void
    {
        if ($value !== '' && $resolved === null) {
            $this->warn($line, "{$label} \"{$value}\" tidak ditemukan, dikosongkan.");
        }
    }

    /** Normalisasi status PKL ke enum belum/proses/selesai. */
    private function status(string $value): ?string
    {
        if ($value === '') {
            return 'belum';
        }

        return match (mb_strtolower($value)) {
            'belum', 'belum mulai' => 'belum',
            'proses', 'berjalan' => 'proses',
            'selesai' => 'selesai',
            default => null,
        };
    }
}
