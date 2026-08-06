<?php

namespace App\Imports;

use App\Imports\Concerns\ImportsRows;
use App\Models\Departemen;
use App\Support\ImportDefaults;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\SkipsUnknownSheets;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Impor Jurusan. Kolom: Nama. Slug dibuat otomatis. Jurusan yang sudah ada
 * (nama sama) dilewati.
 */
class DepartemenImport implements SkipsEmptyRows, SkipsUnknownSheets, ToCollection, WithHeadingRow, WithMultipleSheets
{
    use ImportsRows;

    public function sheetName(): string
    {
        return ImportDefaults::SHEETS['jurusan'];
    }

    /**
     * @param  Collection<int, Collection<string, mixed>>  $rows
     */
    public function collection(Collection $rows): void
    {
        $existing = Departemen::query()->pluck('name')->map(fn ($n) => mb_strtolower(trim((string) $n)))->all();
        $seen = [];

        foreach ($rows as $index => $row) {
            $line = $index + 2;
            $name = trim((string) ($row['nama'] ?? ''));

            if ($name === '') {
                $this->fail($line, 'Nama jurusan wajib diisi.');

                continue;
            }

            $key = mb_strtolower($name);

            if (in_array($key, $existing, true) || in_array($key, $seen, true)) {
                $this->skip($line, "Jurusan \"{$name}\" sudah ada.");

                continue;
            }

            Departemen::create([
                'name' => $name,
                'slug' => $this->uniqueSlug($name),
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

        while (Departemen::query()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.++$suffix;
        }

        return $slug;
    }
}
