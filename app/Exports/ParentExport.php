<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Parents;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * @implements WithMapping<Parents>
 */
class ParentExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Parents>
     */
    public function query(): Builder
    {
        return Parents::query()->with('users:id,email')->orderBy('nama');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Nama', 'Email', 'Jenis Kelamin', 'Alamat', 'Pekerjaan', 'No HP'];
    }

    /**
     * @param  Parents  $parent
     * @return array<int, string|null>
     */
    public function map($parent): array
    {
        return [
            $parent->nama,
            $parent->users?->email,
            match ($parent->gender) {
                'L' => 'Laki-laki',
                'P' => 'Perempuan',
                default => $parent->gender,
            },
            $parent->alamat,
            $parent->occupation,
            $parent->phoneNumber,
        ];
    }
}
