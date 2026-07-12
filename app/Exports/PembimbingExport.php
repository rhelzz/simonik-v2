<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Pembimbing;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * @implements WithMapping<Pembimbing>
 */
class PembimbingExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Pembimbing>
     */
    public function query(): Builder
    {
        return Pembimbing::query()->with('user:id,email')->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Nama', 'Email', 'No HP', 'Jenis Kelamin'];
    }

    /**
     * @param  Pembimbing  $pembimbing
     * @return array<int, string|null>
     */
    public function map($pembimbing): array
    {
        return [
            $pembimbing->name,
            $pembimbing->user?->email,
            $pembimbing->no_hp,
            match ($pembimbing->gender) {
                'L' => 'Laki-laki',
                'P' => 'Perempuan',
                default => null,
            },
        ];
    }
}
