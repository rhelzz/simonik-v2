<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Departemen;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor Kepala Program. Kolom: Nama, Email, Jurusan (boleh lebih dari satu,
 * dipisah ";"). Membuat akun ber-role `kaprog` (kata sandi default "password")
 * lalu menautkan jurusan yang dipimpin. Email terdaftar dilewati.
 */
class KaprogImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
{
    use ImportsRows;

    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        $departemens = $this->lookup(Departemen::query()->pluck('id', 'name'));
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

            // Resolusi jurusan (opsional, boleh lebih dari satu).
            $names = preg_split('/[;,]/', (string) ($row['jurusan'] ?? '')) ?: [];
            $ids = [];
            $unknown = [];

            foreach ($names as $n) {
                $n = trim((string) $n);

                if ($n === '') {
                    continue;
                }

                $id = $departemens[mb_strtolower($n)] ?? null;

                if ($id === null) {
                    $unknown[] = $n;
                } else {
                    $ids[] = $id;
                }
            }

            if ($unknown !== []) {
                $this->fail($line, 'Jurusan tidak ditemukan: '.implode(', ', $unknown).'.');

                continue;
            }

            $user = $this->makeUser($name, $email, 'kaprog');

            if ($ids !== []) {
                Departemen::query()->whereIn('id', $ids)->update(['user_id' => $user->id]);
            }

            $seen[] = $email;
            $this->created++;
        }
    }
}
