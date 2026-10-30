<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Industry;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * Export data profil industri (DUDI) untuk sinkronisasi e-Rapor Kemendikdasmen.
 *
 * @implements WithMapping<Industry>
 */
class IndustryDudiExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Industry>
     */
    public function query(): Builder
    {
        return Industry::query()
            ->with(['pembimbingNormatif:id,name'])
            ->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'No',
            'NIB',
            'Nama Perusahaan',
            'Bidang Usaha',
            'Alamat Lokasi',
            'RT',
            'RW',
            'Dusun',
            'Kelurahan/Desa',
            'Kecamatan',
            'Kode Pos',
            'Lintang (Latitude)',
            'Bujur (Longitude)',
            'Email',
            'Website',
            'NPWP',
            'Pembimbing Industri',
            'Status Kelengkapan e-Rapor',
        ];
    }

    private int $row = 0;

    /**
     * @param  Industry  $industry
     * @return array<int, string|int|null>
     */
    public function map($industry): array
    {
        $this->row++;

        return [
            $this->row,
            $industry->nib ?? '-',
            $industry->name,
            $industry->bidang,
            $industry->alamat,
            $industry->rt ?? '-',
            $industry->rw ?? '-',
            $industry->dusun ?? '-',
            $industry->kelurahan ?? '-',
            $industry->kecamatan ?? '-',
            $industry->kode_pos ?? '-',
            $industry->latitude ?? '-',
            $industry->longitude ?? '-',
            $industry->email ?? '-',
            $industry->website ?? '-',
            $industry->npwp ?? '-',
            $industry->pembimbingNormatif?->name ?? '-',
            $industry->hasCompleteDudiProfile() ? 'Lengkap' : 'Belum Lengkap',
        ];
    }
}
