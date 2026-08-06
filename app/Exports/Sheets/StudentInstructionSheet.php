<?php

namespace App\Exports\Sheets;

use App\Imports\StudentsImport;
use App\Support\ImportDefaults;
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
            ['Email', 'Wajib', 'Boleh diisi username saja, mis. "budi.santoso" — otomatis menjadi budi.santoso@'.ImportDefaults::EMAIL_DOMAIN.'. Harus unik.'],
            ['NIS', 'Opsional', 'Nomor Induk Siswa (panjang bebas). Tidak boleh sama dengan siswa lain.'],
            ['Jenis Kelamin', 'Opsional', 'Isi "Laki-laki" atau "Perempuan" (boleh juga L / P).'],
            ['Tempat Lahir', 'Opsional', 'Kota/kabupaten kelahiran.'],
            ['Tanggal Lahir', 'Opsional', 'Format YYYY-MM-DD, contoh 2008-05-14.'],
            ['Golongan Darah', 'Opsional', 'Isi A, B, AB, atau O. Kosongkan / isi "-" bila tidak tahu.'],
            ['Alamat', 'Opsional', 'Alamat tempat tinggal lengkap.'],
            ['Kelas', 'Opsional', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Jurusan', 'Opsional', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Industri', 'Opsional', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Orang Tua', 'Opsional', 'Ketik sama persis dengan salah satu nama di sheet "Referensi".'],
            ['Status PKL', 'Opsional', 'Belum, Proses, atau Selesai. Dikosongkan = Belum.'],
            ['PKL Mulai', 'Opsional', 'Format YYYY-MM-DD. Boleh dikosongkan.'],
            ['PKL Selesai', 'Opsional', 'Format YYYY-MM-DD, tidak boleh lebih awal dari PKL Mulai.'],
            ['', '', ''],
            [
                'CONTOH',
                '',
                'Budi Santoso | 0012345678 | budi.santoso | Laki-laki | Bandung | 2008-05-14 | O | '
                    .'Jl. Merdeka No. 1 | XI RPL 1 | Rekayasa Perangkat Lunak | PT Contoh Industri | Santoso | Belum',
            ],
            ['', '', ''],
            [
                'CATATAN',
                '',
                'Setiap akun siswa dibuat dengan kata sandi default "'.StudentsImport::DEFAULT_PASSWORD.'". '
                    .'Isi data mulai baris ke-2 pada sheet "'.ImportDefaults::SHEETS['siswa'].'" (baris ke-1 adalah judul kolom, jangan diubah). '
                    .'Hanya Nama & Email yang wajib — kolom lain boleh dikosongkan dan dilengkapi siswa setelah login. '
                    .'Nama Kelas/Jurusan/Industri/Orang Tua yang tidak dikenal akan dikosongkan, bukan menggagalkan impor. '
                    .'Baris yang salah dilaporkan satu per satu; baris lain tetap diimpor. '
                    .'Email atau NIS yang sudah terdaftar dilewati, tidak ditimpa.',
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
