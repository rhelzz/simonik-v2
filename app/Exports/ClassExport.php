<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Classes;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * @implements WithMapping<Classes>
 */
class ClassExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Classes>
     */
    public function query(): Builder
    {
        return Classes::query()->with('departemens:id,name')->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Nama', 'Jurusan'];
    }

    /**
     * @param  Classes  $class
     * @return array<int, string|null>
     */
    public function map($class): array
    {
        return [
            $class->name,
            $class->departemens?->name,
        ];
    }
}
