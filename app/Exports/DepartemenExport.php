<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Departemen;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * @implements WithMapping<Departemen>
 */
class DepartemenExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Departemen>
     */
    public function query(): Builder
    {
        return Departemen::query()->withCount('classes')->with('users:id,name')->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Nama', 'Jumlah Kelas', 'Kepala Program'];
    }

    /**
     * @param  Departemen  $departemen
     * @return array<int, string|int|null>
     */
    public function map($departemen): array
    {
        return [
            $departemen->name,
            (int) $departemen->getAttribute('classes_count'),
            $departemen->users?->name,
        ];
    }
}
