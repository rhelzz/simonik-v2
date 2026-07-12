<?php

namespace App\Exports\Sheets;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Parents;
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
        return ['Kelas', 'Jurusan', 'Industri', 'Orang Tua'];
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        $classes = Classes::query()->orderBy('name')->pluck('name')->all();
        $departemens = Departemen::query()->orderBy('name')->pluck('name')->all();
        $industries = Industry::query()->orderBy('name')->pluck('name')->all();
        $parents = Parents::query()->orderBy('nama')->pluck('nama')->all();

        $max = max(
            count($classes),
            count($departemens),
            count($industries),
            count($parents),
        );

        $rows = [];

        for ($i = 0; $i < $max; $i++) {
            $rows[] = [
                $classes[$i] ?? '',
                $departemens[$i] ?? '',
                $industries[$i] ?? '',
                $parents[$i] ?? '',
            ];
        }

        return $rows;
    }
}
