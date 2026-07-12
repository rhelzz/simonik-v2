<?php

namespace App\Exports\Concerns;

use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Styling seragam untuk baris judul kolom (row 1): teks tebal putih di atas
 * latar indigo (warna primary SIMONIK), baris judul dibekukan, dan auto-filter
 * aktif. Dipakai bersama `WithStyles` + `WithEvents`.
 */
trait StylesHeadings
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F5BD5'],
                ],
            ],
        ];
    }

    /**
     * @return array<string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();
                $highestColumn = $sheet->getHighestColumn();

                $sheet->freezePane('A2');
                $sheet->setAutoFilter("A1:{$highestColumn}1");
                $sheet->getRowDimension(1)->setRowHeight(22);
                $sheet->getStyle("A1:{$highestColumn}1")
                    ->getAlignment()
                    ->setVertical('center');
            },
        ];
    }
}
