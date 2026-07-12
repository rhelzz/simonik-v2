<?php

namespace App\Exports\Sheets;

use App\Exports\Concerns\StylesHeadings;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Sheet "Referensi" generik: tiap kolom berisi daftar nilai valid untuk kolom
 * relasi (mis. daftar Jurusan, Guru, Pembimbing), agar pengisi tahu nama persis
 * yang dikenali importer.
 */
class GenericReferenceSheet implements FromArray, ShouldAutoSize, WithEvents, WithHeadings, WithStyles, WithTitle
{
    use StylesHeadings;

    /**
     * @param  array<int, string>  $headings
     * @param  array<int, array<int, string>>  $columns  Nilai per kolom (indeks selaras dengan $headings).
     */
    public function __construct(
        private readonly array $headings,
        private readonly array $columns,
    ) {}

    public function title(): string
    {
        return 'Referensi';
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return $this->headings;
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        $max = 0;

        foreach ($this->columns as $values) {
            $max = max($max, count($values));
        }

        $rows = [];

        for ($i = 0; $i < $max; $i++) {
            $row = [];

            foreach ($this->columns as $values) {
                $row[] = $values[$i] ?? '';
            }

            $rows[] = $row;
        }

        return $rows;
    }
}
