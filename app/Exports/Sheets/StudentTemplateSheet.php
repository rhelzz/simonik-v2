<?php

namespace App\Exports\Sheets;

use App\Exports\Concerns\StylesHeadings;
use App\Support\ImportDefaults;
use App\Support\ImportSpecs;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Sheet "Data Siswa" pada template impor: hanya baris judul kolom. Judul kolom
 * harus sama persis dengan yang dibaca importer.
 *
 * Sengaja tanpa baris contoh — importer membaca sheet ini apa adanya, jadi
 * contoh yang lupa dihapus operator akan ikut tersimpan sebagai siswa sungguhan.
 * Contoh pengisian ada di sheet "Petunjuk".
 */
class StudentTemplateSheet implements FromArray, ShouldAutoSize, WithEvents, WithHeadings, WithStyles, WithTitle
{
    use StylesHeadings;

    public function title(): string
    {
        return ImportDefaults::SHEETS['siswa'];
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ImportSpecs::siswa()['headings'];
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        return [];
    }
}
