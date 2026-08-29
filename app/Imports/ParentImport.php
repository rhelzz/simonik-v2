<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Parents;
use App\Models\Student;
use App\Support\ImportDefaults;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsUnknownSheets;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Impor Orang Tua. Kolom minimum: Nama Anak, Nama Orang Tua, dan No HP.
 * Email opsional; akun login hanya dibuat jika email diisi.
 */
class ParentImport implements SkipsEmptyRows, SkipsUnknownSheets, ToCollection, WithHeadingRow, WithMultipleSheets
{
    use ImportsRows;

    public function sheetName(): string
    {
        return ImportDefaults::SHEETS['orangtua'];
    }

    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        $existing = $this->existingEmails();
        $seen = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $childName = trim((string) ($row['nama_anak'] ?? ''));
            $name = trim((string) ($row['nama_orang_tua'] ?? ''));
            $email = $this->email($row['email'] ?? '');
            $genderRaw = trim((string) ($row['jenis_kelamin'] ?? ''));
            $gender = $this->gender($genderRaw);
            $alamat = trim((string) ($row['alamat'] ?? ''));
            $occupation = trim((string) ($row['pekerjaan'] ?? ''));
            $phone = trim((string) ($row['no_hp'] ?? ''));

            if ($childName === '' || $name === '' || $phone === '') {
                $this->fail($line, 'Nama Anak, Nama Orang Tua, dan No HP wajib diisi.');

                continue;
            }

            if ($email !== '' && ! $this->isEmail($email)) {
                $this->fail($line, "Email \"{$email}\" tidak valid.");

                continue;
            }

            if ($genderRaw !== '' && $gender === null) {
                $this->fail($line, 'Jenis Kelamin harus Laki-laki/L atau Perempuan/P.');

                continue;
            }

            if ($email !== '' && (in_array($email, $existing, true) || in_array($email, $seen, true))) {
                $this->skip($line, "Email {$email} sudah terdaftar.");

                continue;
            }

            $students = Student::query()
                ->whereRaw('LOWER(TRIM(name)) = ?', [mb_strtolower($childName)])
                ->limit(2)
                ->get(['id', 'parent_id']);

            if ($students->count() !== 1) {
                $message = $students->isEmpty()
                    ? "Nama anak \"{$childName}\" tidak ditemukan."
                    : "Nama anak \"{$childName}\" tidak unik; tautkan orang tua secara manual.";
                $this->fail($line, $message);

                continue;
            }

            $student = $students->first();

            if ($student->parent_id !== null) {
                $this->fail($line, "Anak \"{$childName}\" sudah memiliki orang tua/wali.");

                continue;
            }

            DB::transaction(function () use ($student, $name, $email, $gender, $alamat, $occupation, $phone): void {
                $user = $email === '' ? null : $this->makeUser($name, $email, 'orangtua');
                $parent = Parents::create([
                    'user_id' => $user?->id,
                    'nama' => $name,
                    'gender' => $gender,
                    'alamat' => $alamat,
                    'occupation' => $occupation,
                    'phoneNumber' => $phone,
                ]);

                $student->update(['parent_id' => $parent->id]);
            });

            if ($email !== '') {
                $seen[] = $email;
            }
            $this->created++;
        }
    }
}
