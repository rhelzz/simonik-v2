<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;

/**
 * Sheet "Petunjuk" generik: judul besar, tabel penjelasan tiap kolom
 * (Kolom | Wajib | Cara mengisi), lalu baris catatan. Dipakai semua template
 * impor entitas.
 */
class GenericInstructionSheet implements FromArray, WithColumnWidths, WithEvents, WithTitle
{
    private const TABLE_HEADER_ROW = 3;

    /**
     * @param  array<int, array{0: string, 1: string, 2: string}>  $rows  Penjelasan per kolom.
     */
    public function __construct(
        private readonly string $heading,
        private readonly array $rows,
        private readonly string $notes,
    ) {}

    public function title(): string
    {
        return 'Petunjuk';
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        $out = [
            [$this->heading, '', ''],
            ['', '', ''],
            ['Kolom', 'Wajib', 'Cara mengisi'],
        ];

        foreach ($this->rows as $row) {
            $out[] = [$row[0], $row[1], $row[2]];
        }

        $out[] = ['', '', ''];
        $out[] = ['CATATAN', '', $this->notes];

        return $out;
    }

    /**
     * @return array<string, int>
     */
    public function columnWidths(): array
    {
        return ['A' => 22, 'B' => 12, 'C' => 90];
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

                $sheet->mergeCells('A1:C1');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14)
                    ->getColor()->setRGB('4F5BD5');
                $sheet->getRowDimension(1)->setRowHeight(26);

                $header = 'A'.self::TABLE_HEADER_ROW.':C'.self::TABLE_HEADER_ROW;
                $sheet->getStyle($header)->getFont()->setBold(true)
                    ->getColor()->setRGB('FFFFFF');
                $sheet->getStyle($header)->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('4F5BD5');

                $sheet->getStyle('A'.self::TABLE_HEADER_ROW.':C'.$lastRow)
                    ->getAlignment()
                    ->setVertical(Alignment::VERTICAL_TOP)
                    ->setWrapText(true);

                $sheet->getStyle('A'.$lastRow.':C'.$lastRow)->getFont()->setBold(true);
            },
        ];
    }
}
