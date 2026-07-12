<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Classes;
use App\Models\Departemen;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

/**
 * Impor Kelas. Kolom: Nama, Jurusan (di-resolve ke id berdasarkan nama). Kelas
 * dengan nama sama pada jurusan yang sama dilewati.
 */
class ClassImport implements SkipsEmptyRows, ToCollection, WithHeadingRow
{
    use ImportsRows;

    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        $departemens = $this->lookup(Departemen::query()->pluck('id', 'name'));
        $existing = Classes::query()
            ->get(['name', 'departemen_id'])
            ->map(fn (Classes $c) => mb_strtolower(trim($c->name)).'|'.$c->departemen_id)
            ->all();
        $seen = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $name = trim((string) ($row['nama'] ?? ''));
            $jurusan = trim((string) ($row['jurusan'] ?? ''));
            $departemenId = $departemens[mb_strtolower($jurusan)] ?? null;

            if ($name === '') {
                $this->fail($line, 'Nama kelas wajib diisi.');

                continue;
            }

            if ($jurusan === '') {
                $this->fail($line, 'Jurusan wajib diisi.');

                continue;
            }

            if ($departemenId === null) {
                $this->fail($line, "Jurusan \"{$jurusan}\" tidak ditemukan.");

                continue;
            }

            $key = mb_strtolower($name).'|'.$departemenId;

            if (in_array($key, $existing, true) || in_array($key, $seen, true)) {
                $this->skip($line, "Kelas \"{$name}\" pada jurusan tersebut sudah ada.");

                continue;
            }

            Classes::create([
                'name' => $name,
                'slug' => $this->uniqueSlug($name),
                'departemen_id' => $departemenId,
            ]);

            $seen[] = $key;
            $this->created++;
        }
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (Classes::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.++$suffix;
        }

        return $slug;
    }
}
