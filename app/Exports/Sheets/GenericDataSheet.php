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
 * Sheet data generik untuk template impor: baris judul kolom + satu baris
 * contoh pengisian, ber-styling seragam.
 */
class GenericDataSheet implements FromArray, ShouldAutoSize, WithEvents, WithHeadings, WithStyles, WithTitle
{
    use StylesHeadings;

    /**
     * @param  array<int, string>  $headings
     * @param  array<int, string>  $example
     */
    public function __construct(
        private readonly string $sheetTitle,
        private readonly array $headings,
        private readonly array $example,
    ) {}

    public function title(): string
    {
        return $this->sheetTitle;
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
        return [$this->example];
    }
}
