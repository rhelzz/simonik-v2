<?php

namespace App\Exports;

use App\Exports\Sheets\GenericDataSheet;
use App\Exports\Sheets\GenericInstructionSheet;
use App\Exports\Sheets\GenericReferenceSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Template impor generik dari konfigurasi: sheet "Petunjuk", sheet data
 * (hanya judul kolom), dan (opsional) sheet "Referensi" berisi nilai relasi
 * valid.
 */
class GenericTemplateExport implements WithMultipleSheets
{
    /**
     * @param  array<int, array{0: string, 1: string, 2: string}>  $instructions
     * @param  array<int, string>  $headings
     * @param  array<string, array<int, string>>  $references  Judul kolom => daftar nilai valid.
     */
    public function __construct(
        private readonly string $heading,
        private readonly string $notes,
        private readonly string $dataTitle,
        private readonly array $instructions,
        private readonly array $headings,
        private readonly array $references = [],
    ) {}

    /**
     * @return array<int, object>
     */
    public function sheets(): array
    {
        $sheets = [
            new GenericInstructionSheet($this->heading, $this->instructions, $this->notes),
            new GenericDataSheet($this->dataTitle, $this->headings),
        ];

        if ($this->references !== []) {
            $sheets[] = new GenericReferenceSheet(
                array_keys($this->references),
                array_values($this->references),
            );
        }

        return $sheets;
    }
}
