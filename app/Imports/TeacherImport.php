<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Departemen;
use App\Models\Teacher;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor Guru Pembimbing. Kolom: Nama, Email, No HP, Jurusan. Membuat akun
 * ber-role `guru` (kata sandi default "password") + profil guru. Email terdaftar
 * dilewati.
 */
class TeacherImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
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
            $noHp = trim((string) ($row['no_hp'] ?? ''));
            $jurusan = trim((string) ($row['jurusan'] ?? ''));
            $departemenId = $departemens[mb_strtolower($jurusan)] ?? null;

            if ($name === '' || $email === '' || $noHp === '') {
                $this->fail($line, 'Nama, Email, dan No HP wajib diisi.');

                continue;
            }

            if (! $this->isEmail($email)) {
                $this->fail($line, "Email \"{$email}\" tidak valid.");

                continue;
            }

            if ($jurusan === '' || $departemenId === null) {
                $this->fail($line, $jurusan === '' ? 'Jurusan wajib diisi.' : "Jurusan \"{$jurusan}\" tidak ditemukan.");

                continue;
            }

            if (in_array($email, $existing, true) || in_array($email, $seen, true)) {
                $this->skip($line, "Email {$email} sudah terdaftar.");

                continue;
            }

            $user = $this->makeUser($name, $email, 'guru');

            Teacher::create([
                'user_id' => $user->id,
                'name' => $name,
                'no_hp' => $noHp,
                'departemen_id' => $departemenId,
            ]);

            $seen[] = $email;
            $this->created++;
        }
    }
}
