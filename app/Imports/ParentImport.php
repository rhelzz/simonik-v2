<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Parents;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor Orang Tua. Kolom: Nama, Email, Jenis Kelamin, Alamat, Pekerjaan, No HP.
 * Membuat akun ber-role `orangtua` (kata sandi default "password") + profil.
 * Email terdaftar dilewati.
 */
class ParentImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
{
    use ImportsRows;

    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        $existing = $this->existingEmails();
        $seen = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $name = trim((string) ($row['nama'] ?? ''));
            $email = mb_strtolower(trim((string) ($row['email'] ?? '')));
            $gender = $this->gender((string) ($row['jenis_kelamin'] ?? ''));
            $alamat = trim((string) ($row['alamat'] ?? ''));
            $occupation = trim((string) ($row['pekerjaan'] ?? ''));
            $phone = trim((string) ($row['no_hp'] ?? ''));

            if ($name === '' || $email === '' || $alamat === '' || $occupation === '' || $phone === '') {
                $this->fail($line, 'Nama, Email, Alamat, Pekerjaan, dan No HP wajib diisi.');

                continue;
            }

            if (! $this->isEmail($email)) {
                $this->fail($line, "Email \"{$email}\" tidak valid.");

                continue;
            }

            if ($gender === null) {
                $this->fail($line, 'Jenis Kelamin harus Laki-laki/L atau Perempuan/P.');

                continue;
            }

            if (in_array($email, $existing, true) || in_array($email, $seen, true)) {
                $this->skip($line, "Email {$email} sudah terdaftar.");

                continue;
            }

            $user = $this->makeUser($name, $email, 'orangtua');

            Parents::create([
                'user_id' => $user->id,
                'nama' => $name,
                'gender' => $gender,
                'alamat' => $alamat,
                'occupation' => $occupation,
                'phoneNumber' => $phone,
            ]);

            $seen[] = $email;
            $this->created++;
        }
    }
}
