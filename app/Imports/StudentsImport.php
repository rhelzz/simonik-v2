<?php

namespace App\Imports;

use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Impor data siswa dari Excel. Relasi (kelas/jurusan/industri/orang tua) diisi
 * dengan NAMA lalu di-resolve ke id. Setiap siswa dibuatkan akun login ber-role
 * `siswa` dengan kata sandi default "password". Bersifat semua-atau-tidak: bila
 * ada baris tak valid, tidak ada satu pun yang disimpan (lihat `$errors`).
 */
class StudentsImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
{
    /** Kata sandi default untuk setiap akun siswa hasil impor. */
    public const DEFAULT_PASSWORD = 'password';

    /** @var array<string, string> pesan galat per-baris (kosong bila sukses) */
    public array $errors = [];

    /** Jumlah siswa yang berhasil diimpor. */
    public int $created = 0;

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

        $existingEmails = User::query()->pluck('email')->map(fn ($e) => mb_strtolower((string) $e))->all();
        $existingNis = Student::query()->pluck('nis')->map(fn ($n) => (string) $n)->all();

        /** @var array<int, array{account: array<string, mixed>, profile: array<string, mixed>}> $payloads */
        $payloads = [];
        $seenEmails = [];
        $seenNis = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2; // baris 1 = judul kolom
            $get = fn (string $key): string => trim((string) ($row[$key] ?? ''));

            $email = mb_strtolower($get('email'));
            $nis = $get('nis');
            $gender = $this->gender($get('jenis_kelamin'));
            $bloodType = mb_strtoupper($get('golongan_darah'));
            $status = $this->status($get('status_pkl'));
            $dob = $this->date($row['tanggal_lahir'] ?? null);

            $classId = $classes[mb_strtolower($get('kelas'))] ?? null;
            $departemenId = $departemens[mb_strtolower($get('jurusan'))] ?? null;
            $industriId = $industries[mb_strtolower($get('industri'))] ?? null;
            $parentId = $parents[mb_strtolower($get('orang_tua'))] ?? null;

            $rowErrors = [];

            // Relasi yang tidak dikenal — pesan spesifik agar mudah diperbaiki.
            $this->requireRef($rowErrors, 'Kelas', $get('kelas'), $classId);
            $this->requireRef($rowErrors, 'Jurusan', $get('jurusan'), $departemenId);
            $this->requireRef($rowErrors, 'Industri', $get('industri'), $industriId);
            $this->requireRef($rowErrors, 'Orang Tua', $get('orang_tua'), $parentId);

            if ($gender === null) {
                $rowErrors[] = 'Jenis Kelamin harus "Laki-laki"/"L" atau "Perempuan"/"P".';
            }

            if ($status === null) {
                $rowErrors[] = 'Status PKL harus Belum, Proses, atau Selesai.';
            }

            if ($get('tanggal_lahir') !== '' && $dob === null) {
                $rowErrors[] = 'Tanggal Lahir tidak valid (gunakan format YYYY-MM-DD).';
            }

            if ($email !== '' && in_array($email, $seenEmails, true)) {
                $rowErrors[] = "Email {$email} ganda di dalam berkas.";
            }

            if ($nis !== '' && in_array($nis, $seenNis, true)) {
                $rowErrors[] = "NIS {$nis} ganda di dalam berkas.";
            }

            $validator = Validator::make(
                [
                    'name' => $get('nama'),
                    'email' => $email,
                    'nis' => $nis,
                    'tempat_lahir' => $get('tempat_lahir'),
                    'tanggal_lahir' => $dob,
                    'golongan_darah' => $bloodType,
                    'alamat' => $get('alamat'),
                    'pkl_mulai' => $this->date($row['pkl_mulai'] ?? null),
                    'pkl_selesai' => $this->date($row['pkl_selesai'] ?? null),
                ],
                [
                    'name' => ['required', 'string', 'max:255'],
                    'email' => ['required', 'email', 'max:255'],
                    'nis' => ['required', 'string', 'max:50'],
                    'tempat_lahir' => ['required', 'string', 'max:255'],
                    'tanggal_lahir' => ['required', 'date'],
                    'golongan_darah' => ['required', 'in:A,B,AB,O'],
                    'alamat' => ['required', 'string'],
                    'pkl_selesai' => ['nullable', 'date', 'after_or_equal:pkl_mulai'],
                ],
                [
                    'required' => ':attribute wajib diisi.',
                    'email' => 'Email tidak valid.',
                ],
            );

            foreach ($validator->errors()->all() as $message) {
                $rowErrors[] = $message;
            }

            if ($email !== '' && in_array($email, $existingEmails, true)) {
                $rowErrors[] = "Email {$email} sudah terdaftar.";
            }

            if ($rowErrors !== []) {
                $this->errors["row_{$line}"] = "Baris {$line}: ".implode(' ', $rowErrors);

                continue;
            }

            $seenEmails[] = $email;
            $seenNis[] = $nis;

            $payloads[] = [
                'account' => [
                    'name' => $get('nama'),
                    'email' => $email,
                ],
                'profile' => [
                    'name' => $get('nama'),
                    'nis' => $nis,
                    'placeOfBirth' => $get('tempat_lahir'),
                    'dateOfBirth' => $dob,
                    'gender' => $gender,
                    'bloodType' => $bloodType,
                    'alamat' => $get('alamat'),
                    'status_pkl' => $status,
                    'pkl_start' => $this->date($row['pkl_mulai'] ?? null),
                    'pkl_end' => $this->date($row['pkl_selesai'] ?? null),
                    'class_id' => $classId,
                    'industri_id' => $industriId,
                    'departemen_id' => $departemenId,
                    'parent_id' => $parentId,
                ],
            ];
        }

        // Semua-atau-tidak: jangan simpan apa pun bila ada baris bermasalah.
        if ($this->errors !== [] || $payloads === []) {
            return;
        }

        DB::transaction(function () use ($payloads): void {
            foreach ($payloads as $payload) {
                $user = User::create([
                    ...$payload['account'],
                    'password' => Hash::make(self::DEFAULT_PASSWORD),
                    'email_verified_at' => now(),
                ]);
                $user->assignRole('siswa');

                Student::create([
                    ...$payload['profile'],
                    'user_id' => $user->id,
                ]);

                $this->created++;
            }
        });
    }

    /**
     * Peta nama (huruf kecil) -> id dari koleksi `pluck('id', 'name')`.
     *
     * @param  Collection<string, int>  $pairs
     * @return array<string, int>
     */
    private function lookup(Collection $pairs): array
    {
        $map = [];

        foreach ($pairs as $name => $id) {
            $map[mb_strtolower(trim((string) $name))] = (int) $id;
        }

        return $map;
    }

    /**
     * Tambahkan galat bila relasi diisi tapi tak dikenal, atau kosong.
     *
     * @param  array<int, string>  $errors
     */
    private function requireRef(array &$errors, string $label, string $value, ?int $resolved): void
    {
        if ($value === '') {
            $errors[] = "{$label} wajib diisi.";

            return;
        }

        if ($resolved === null) {
            $errors[] = "{$label} \"{$value}\" tidak ditemukan.";
        }
    }

    /** Normalisasi jenis kelamin ke 'L'/'P'. */
    private function gender(string $value): ?string
    {
        return match (mb_strtolower($value)) {
            'l', 'laki-laki', 'laki', 'pria', 'male' => 'L',
            'p', 'perempuan', 'wanita', 'female' => 'P',
            default => null,
        };
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

    /** Ubah nilai tanggal (serial Excel atau teks) menjadi 'Y-m-d'. */
    private function date(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_numeric($value)) {
            return ExcelDate::excelToDateTimeObject((float) $value)->format('Y-m-d');
        }

        try {
            return Carbon::parse((string) $value)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}
