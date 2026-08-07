<?php

namespace App\Exports\Sheets;

use App\Exports\Concerns\StylesHeadings;
use App\Support\ImportSpecs;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Sheet "Referensi" pada template impor: daftar nilai valid (kelas, jurusan,
 * industri, orang tua) yang boleh diketik di kolom relasi — supaya pengisi tahu
 * persis nama yang dikenali importer.
 */
class StudentReferenceSheet implements FromArray, ShouldAutoSize, WithEvents, WithHeadings, WithStyles, WithTitle
{
    use StylesHeadings;

    public function title(): string
    {
        return 'Referensi';
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return array_keys(ImportSpecs::siswaReferences());
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        $columns = array_values(ImportSpecs::siswaReferences());

        if ($columns === []) {
            return [];
        }

        $max = max(array_map('count', $columns));

        $rows = [];

        for ($i = 0; $i < $max; $i++) {
            $rows[] = array_map(fn (array $values): string => $values[$i] ?? '', $columns);
        }

        return $rows;
    }
}
