<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor Wakasek. Kolom: Nama, Email. Membuat akun ber-role `wakasek` dengan
 * kata sandi default "password". Email yang sudah terdaftar dilewati.
 */
class WakasekImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
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

            if ($name === '' || $email === '') {
                $this->fail($line, 'Nama dan Email wajib diisi.');

                continue;
            }

            if (! $this->isEmail($email)) {
                $this->fail($line, "Email \"{$email}\" tidak valid.");

                continue;
            }

            if (in_array($email, $existing, true) || in_array($email, $seen, true)) {
                $this->skip($line, "Email {$email} sudah terdaftar.");

                continue;
            }

            $this->makeUser($name, $email, 'wakasek');

            $seen[] = $email;
            $this->created++;
        }
    }
}
