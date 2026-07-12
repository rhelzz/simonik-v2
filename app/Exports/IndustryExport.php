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
 * @implements WithMapping<Industry>
 */
class IndustryExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Industry>
     */
    public function query(): Builder
    {
        return Industry::query()
            ->with(['teachers:id,name', 'pembimbingNormatif:id,name'])
            ->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return [
            'Nama', 'Bidang', 'Alamat', 'Longitude', 'Latitude', 'Radius',
            'Jam Masuk', 'Jam Pulang', 'Durasi', 'Kuota',
            'Guru Pembimbing', 'Pembimbing Industri',
        ];
    }

    /**
     * @param  Industry  $industry
     * @return array<int, string|int|null>
     */
    public function map($industry): array
    {
        return [
            $industry->name,
            $industry->bidang,
            $industry->alamat,
            $industry->longitude,
            $industry->latitude,
            $industry->radius,
            $industry->jam_masuk ? mb_substr((string) $industry->jam_masuk, 0, 5) : null,
            $industry->jam_pulang ? mb_substr((string) $industry->jam_pulang, 0, 5) : null,
            $industry->duration,
            $industry->kuota,
            $industry->teachers?->name,
            $industry->pembimbingNormatif?->name,
        ];
    }
}
