<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * Ekspor seluruh siswa aktif ke Excel dengan kolom terbaca (relasi ditampilkan
 * sebagai nama, bukan id). Format kolom identik dengan template impor agar bisa
 * dijadikan acuan bolak-balik.
 *
 * @implements WithMapping<Student>
 */
class StudentsExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Student>
     */
    public function query(): Builder
    {
        return Student::query()
            ->where('archived', false)
            ->with([
                'users:id,email',
                'classes:id,name',
                'departements:id,name',
                'industries:id,name',
                'parents:id,nama',
                'pkl_period:id,name_period',
            ])
            ->orderBy('name');
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
     * @param  Student  $student
     * @return array<int, string|null>
     */
    public function map($student): array
    {
        return [
            $student->name,
            $student->nis,
            $student->users?->email,
            $student->gender === 'L' ? 'Laki-laki' : 'Perempuan',
            $student->placeOfBirth,
            $student->dateOfBirth->format('Y-m-d'),
            $student->bloodType,
            $student->alamat,
            $student->classes?->name,
            $student->departements?->name,
            $student->industries?->name,
            $student->parents?->nama,
            ucfirst($student->status_pkl),
            $student->pkl_start?->format('Y-m-d'),
            $student->pkl_end?->format('Y-m-d'),
            $student->pkl_period?->name_period,
        ];
    }
}
