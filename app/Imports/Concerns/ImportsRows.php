<?php

namespace App\Imports\Concerns;

use App\Models\User;
use App\Support\ImportDefaults;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

/**
 * Perkakas bersama untuk kelas impor: akumulasi hasil (dibuat/dilewati/gagal)
 * dan pembantu normalisasi nilai (nama relasi, gender, tanggal). Impor bersifat
 * "lewati duplikat" — baris yang sudah ada dicatat sebagai dilewati, baris tak
 * valid dicatat sebagai gagal, sisanya tetap diimpor.
 */
trait ImportsRows
{
    /** Kata sandi default setiap akun hasil impor. */
    public const DEFAULT_PASSWORD = ImportDefaults::PASSWORD;

    /** Nama sheet tunggal yang dipakai PhpSpreadsheet saat memuat CSV. */
    private const CSV_SHEET = 'Worksheet';

    public int $created = 0;

    /** @var array<int, string> */
    public array $skipped = [];

    /** @var array<int, string> */
    public array $failed = [];

    /**
     * Catatan non-fatal: barisnya tetap diimpor, tapi ada nilai yang tidak
     * bisa dipakai (mis. nama relasi tak dikenal → kolomnya dikosongkan).
     *
     * @var array<int, string>
     */
    public array $warnings = [];

    /** Nama sheet yang dicari, direkam agar pesan galat bisa menyebutkannya. */
    public string $wantedSheet = '';

    /**
     * Baca hanya sheet data; sheet "Petunjuk" dan "Referensi" pada template
     * diabaikan. Tanpa ini Laravel Excel menyuapkan *setiap* sheet ke
     * `collection()` yang sama, sehingga baris petunjuk ikut divalidasi
     * sebagai data dan seluruh impor tampak gagal.
     *
     * @return array<string, $this>
     */
    public function sheets(): array
    {
        $this->wantedSheet = $this->sheetName();

        return [
            $this->wantedSheet => $this,
            // Berkas CSV tidak punya sheet bernama: PhpSpreadsheet memuatnya
            // sebagai satu sheet berjudul "Worksheet". Tanpa baris ini seluruh
            // impor CSV berhenti terbaca.
            self::CSV_SHEET => $this,
        ];
    }

    /**
     * Sheet yang didaftarkan `sheets()` tidak ada di berkas — dilewati, bukan
     * dianggap galat. `sheets()` sengaja mendaftar dua kemungkinan (sheet data
     * dan sheet CSV), jadi salah satunya memang selalu absen.
     */
    public function onUnknownSheet($sheetName): void
    {
        // Sengaja tidak melakukan apa-apa: "tidak ada yang terbaca" dideteksi
        // dari hasil impor yang kosong (lihat `HandlesImportExport::runImport`),
        // bukan dari sheet mana yang kebetulan absen.
    }

    /** Nama sheet data yang dibaca importer ini (lihat `ImportDefaults::SHEETS`). */
    abstract public function sheetName(): string;

    protected function skip(int $line, string $message): void
    {
        $this->skipped[] = "Baris {$line}: {$message}";
    }

    protected function fail(int $line, string $message): void
    {
        $this->failed[] = "Baris {$line}: {$message}";
    }

    protected function warn(int $line, string $message): void
    {
        $this->warnings[] = "Baris {$line}: {$message}";
    }

    /**
     * Peta nama (huruf kecil) -> id dari koleksi `pluck('id', 'name')`.
     *
     * @param  Collection<int|string, int|string>  $pairs
     * @return array<string, int>
     */
    protected function lookup(Collection $pairs): array
    {
        $map = [];

        foreach ($pairs as $name => $id) {
            $map[mb_strtolower(trim((string) $name))] = (int) $id;
        }

        return $map;
    }

    /**
     * Daftar email yang sudah terdaftar (huruf kecil).
     *
     * @return array<int, string>
     */
    protected function existingEmails(): array
    {
        return User::query()->pluck('email')->map(fn ($e) => mb_strtolower((string) $e))->all();
    }

    /**
     * Baca kolom Email dan lengkapi domainnya bila operator hanya menulis
     * username (lihat `ImportDefaults::email()`).
     */
    protected function email(mixed $value): string
    {
        return ImportDefaults::email((string) $value);
    }

    protected function isEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /** Buat akun ber-role dengan kata sandi default "password". */
    protected function makeUser(string $name, string $email, string $role): User
    {
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make(self::DEFAULT_PASSWORD),
            'email_verified_at' => now(),
        ]);
        $user->assignRole($role);

        return $user;
    }

    /** Normalisasi jenis kelamin ke 'L'/'P' (atau null bila tak dikenal). */
    protected function gender(string $value): ?string
    {
        return match (mb_strtolower(trim($value))) {
            'l', 'laki-laki', 'laki', 'pria', 'male' => 'L',
            'p', 'perempuan', 'wanita', 'female' => 'P',
            default => null,
        };
    }

    /** Ubah nilai tanggal (serial Excel atau teks) menjadi 'Y-m-d'. */
    protected function date(mixed $value): ?string
    {
        if ($value === null || trim((string) $value) === '') {
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
