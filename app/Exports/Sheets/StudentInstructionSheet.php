<?php

namespace App\Exports\Sheets;

use App\Imports\StudentsImport;
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
        return [
            ['PETUNJUK PENGISIAN IMPOR DATA SISWA', '', ''],
            ['', '', ''],
            ['Kolom', 'Wajib', 'Cara mengisi'],
            ['Nama', 'Wajib', 'Nama lengkap siswa.'],
            ['NIS', 'Wajib', 'Nomor Induk Siswa. Harus unik, tidak boleh sama dengan siswa lain.'],
            ['Email', 'Wajib', 'Email unik untuk akun login siswa.'],
            ['Jenis Kelamin', 'Wajib', 'Isi "Laki-laki" atau "Perempuan" (boleh juga L / P).'],
            ['Tempat Lahir', 'Wajib', 'Kota/kabupaten kelahiran.'],
            ['Tanggal Lahir', 'Wajib', 'Format YYYY-MM-DD, contoh 2008-05-14.'],
            ['Golongan Darah', 'Wajib', 'Isi salah satu: A, B, AB, atau O.'],
            ['Alamat', 'Wajib', 'Alamat tempat tinggal lengkap.'],
            ['Kelas', 'Wajib', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Jurusan', 'Wajib', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Industri', 'Wajib', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Orang Tua', 'Wajib', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Status PKL', 'Opsional', 'Belum, Proses, atau Selesai. Dikosongkan = Belum.'],
            ['PKL Mulai', 'Opsional', 'Format YYYY-MM-DD. Boleh dikosongkan.'],
            ['PKL Selesai', 'Opsional', 'Format YYYY-MM-DD, tidak boleh lebih awal dari PKL Mulai.'],
            ['Periode', 'Opsional', 'Nama periode PKL (jika ada).'],
            ['', '', ''],
            [
                'CATATAN',
                '',
                'Setiap akun siswa dibuat dengan kata sandi default "'.StudentsImport::DEFAULT_PASSWORD.'". '
                    .'Isi data mulai baris ke-2 pada sheet "Data Siswa" (baris ke-1 adalah judul kolom, jangan diubah). '
                    .'Jika ada satu baris yang salah, seluruh impor dibatalkan dan tidak ada data yang tersimpan.',
            ],
        ];
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
