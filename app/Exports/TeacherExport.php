<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * @implements WithMapping<Teacher>
 */
class TeacherExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<Teacher>
     */
    public function query(): Builder
    {
        return Teacher::query()->with(['users:id,email', 'departements:id,name'])->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Nama', 'Email', 'No HP', 'Jurusan'];
    }

    /**
     * @param  Teacher  $teacher
     * @return array<int, string|null>
     */
    public function map($teacher): array
    {
        return [
            $teacher->name,
            $teacher->users?->email,
            $teacher->no_hp,
            $teacher->departements?->name,
        ];
    }
}
