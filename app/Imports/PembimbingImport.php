<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Pembimbing;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor Pembimbing Industri. Kolom: Nama, Email, No HP, Jenis Kelamin (opsional).
 * Membuat akun ber-role `pembimbing` (kata sandi default "password") + profil.
 * Email terdaftar dilewati.
 */
class PembimbingImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
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
            $noHp = trim((string) ($row['no_hp'] ?? ''));
            $genderRaw = trim((string) ($row['jenis_kelamin'] ?? ''));

            if ($name === '' || $email === '' || $noHp === '') {
                $this->fail($line, 'Nama, Email, dan No HP wajib diisi.');

                continue;
            }

            if (! $this->isEmail($email)) {
                $this->fail($line, "Email \"{$email}\" tidak valid.");

                continue;
            }

            if ($genderRaw !== '' && $this->gender($genderRaw) === null) {
                $this->fail($line, 'Jenis Kelamin harus Laki-laki/L atau Perempuan/P.');

                continue;
            }

            if (in_array($email, $existing, true) || in_array($email, $seen, true)) {
                $this->skip($line, "Email {$email} sudah terdaftar.");

                continue;
            }

            $user = $this->makeUser($name, $email, 'pembimbing');

            Pembimbing::create([
                'user_id' => $user->id,
                'name' => $name,
                'no_hp' => $noHp,
                'gender' => $genderRaw === '' ? null : $this->gender($genderRaw),
            ]);

            $seen[] = $email;
            $this->created++;
        }
    }
}
