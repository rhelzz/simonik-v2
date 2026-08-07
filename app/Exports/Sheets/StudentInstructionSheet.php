<?php

namespace App\Exports\Sheets;

use App\Support\ImportSpecs;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Sheet "Petunjuk" pada template impor: judul, tabel penjelasan tiap kolom
 * (wajib/opsional + cara mengisi), dan catatan penting. Diletakkan paling depan
 * agar pengisi membacanya lebih dulu.
 */
class StudentInstructionSheet implements FromArray, WithColumnWidths, WithEvents, WithTitle
{
    /** Baris awal tabel penjelasan (row 1 judul, row 2 kosong). */
    private const TABLE_HEADER_ROW = 3;

    public function title(): string
    {
        return 'Petunjuk';
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        $spec = ImportSpecs::siswa();

        $rows = [
            [$spec['heading'], '', ''],
            ['', '', ''],
            ['Kolom', 'Wajib', 'Cara mengisi'],
        ];

        foreach ($spec['instructions'] as $instruction) {
            $rows[] = $instruction;
        }

        $rows[] = ['', '', ''];
        $rows[] = ['CONTOH', '', implode(' | ', $spec['example'])];
        $rows[] = ['', '', ''];
        $rows[] = ['CATATAN', '', $spec['note']];

        return $rows;
    }

    /**
     * @return array<string, int>
     */
    public function columnWidths(): array
    {
        return ['A' => 20, 'B' => 12, 'C' => 90];
    }

    /**
     * @return array<string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();
                $lastRow = $sheet->getHighestRow();

                // Judul besar (row 1), digabung A1:C1.
                $sheet->mergeCells('A1:C1');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)
                    ->getColor()->setRGB('4F5BD5');
                $sheet->getRowDimension(1)->setRowHeight(26);

                // Baris judul tabel (row 3): tebal putih di atas indigo.
                $header = 'A'.self::TABLE_HEADER_ROW.':C'.self::TABLE_HEADER_ROW;
                $sheet->getStyle($header)->getFont()->setBold(true)
                    ->getColor()->setRGB('FFFFFF');
                $sheet->getStyle($header)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('4F5BD5');

                // Bungkus teks kolom penjelasan + rata atas untuk seluruh tabel.
                $sheet->getStyle('A'.self::TABLE_HEADER_ROW.':C'.$lastRow)
                    ->getAlignment()
                    ->setVertical(Alignment::VERTICAL_TOP)
                    ->setWrapText(true);

                // Sorot baris CATATAN.
                $sheet->getStyle('A'.$lastRow.':C'.$lastRow)->getFont()->setBold(true);
            },
        ];
    }
}
