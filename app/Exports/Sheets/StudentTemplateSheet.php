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
 * Sheet "Data Siswa" pada template impor: baris judul + satu baris contoh
 * pengisian. Judul kolom harus sama persis dengan yang dibaca importer.
 */
class StudentTemplateSheet implements FromArray, ShouldAutoSize, WithEvents, WithHeadings, WithStyles, WithTitle
{
    use StylesHeadings;

    public function title(): string
    {
        return 'Data Siswa';
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Nama',
            'NIS',
            'Email',
            'Jenis Kelamin',
            'Tempat Lahir',
            'Tanggal Lahir',
            'Golongan Darah',
            'Alamat',
            'Kelas',
            'Jurusan',
            'Industri',
            'Orang Tua',
            'Status PKL',
            'PKL Mulai',
            'PKL Selesai',
            'Periode',
        ];
    }

    /**
     * @return array<int, array<int, string>>
     */
    public function array(): array
    {
        // Contoh memakai data referensi terkini agar tidak salah ketik.
        $kelas = Classes::query()->orderBy('name')->value('name') ?? 'Isi sesuai sheet "Referensi"';
        $jurusan = Departemen::query()->orderBy('name')->value('name') ?? 'Isi sesuai sheet "Referensi"';
        $industri = Industry::query()->orderBy('name')->value('name') ?? 'Isi sesuai sheet "Referensi"';
        $orangTua = Parents::query()->orderBy('nama')->value('nama') ?? 'Isi sesuai sheet "Referensi"';

        return [
            [
                'Budi Santoso',
                '0012345678',
                'budi@contoh.sch.id',
                'Laki-laki',
                'Bandung',
                '2008-05-14',
                'O',
                'Jl. Merdeka No. 1',
                $kelas,
                $jurusan,
                $industri,
                $orangTua,
                'Belum',
                '',
                '',
                '',
            ],
        ];
    }
}
