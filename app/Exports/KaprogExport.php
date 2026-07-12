<?php

namespace App\Exports;

use App\Exports\Concerns\StylesHeadings;
use App\Models\Departemen;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;

/**
 * @implements WithMapping<User>
 */
class KaprogExport implements FromQuery, ShouldAutoSize, WithEvents, WithHeadings, WithMapping, WithStyles
{
    use StylesHeadings;

    /**
     * @return Builder<User>
     */
    public function query(): Builder
    {
        return User::query()->role('kaprog')->orderBy('name');
    }

    /**
     * @return array<int, string>
     */
    public function headings(): array
    {
        return ['Nama', 'Email', 'Jurusan'];
    }

    /**
     * @param  User  $user
     * @return array<int, string|null>
     */
    public function map($user): array
    {
        $jurusan = Departemen::query()
            ->where('user_id', $user->id)
            ->orderBy('name')
            ->pluck('name')
            ->implode('; ');

        return [$user->name, $user->email, $jurusan];
    }
}
