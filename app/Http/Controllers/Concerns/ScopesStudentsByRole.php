<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Membatasi query siswa sesuai cakupan role pemanggil. Dipakai semua surface
 * yang menampilkan data siswa lintas role (Rekap Penilaian, Data Absen, dst).
 */
trait ScopesStudentsByRole
{
    /**
     * Query siswa sesuai cakupan role pemanggil.
     *
     * @return Builder<Student>
     */
    protected function scopedStudents(User $user): Builder
    {
        if ($user->hasAnyRole(['admin', 'kaprog'])) {
            return Student::query();
        }

        if ($user->hasRole('guru')) {
            return $this->studentsAtIndustries(
                Industry::query()->where('teacher_id', $user->teachers?->id),
                $user->teachers?->id,
            );
        }

        if ($user->hasRole('pembimbing')) {
            return $this->studentsAtIndustries(
                Industry::query()->where('pembimbing_id', $user->pembimbing?->id),
                $user->pembimbing?->id,
            );
        }

        if ($user->hasAnyRole(['mitra', 'industri'])) {
            $industryId = $user->industries?->id;

            return $industryId === null
                ? $this->none()
                : Student::query()->where('industri_id', $industryId);
        }

        if ($user->hasRole('orangtua')) {
            $parentId = $user->parents?->id;

            return $parentId === null
                ? $this->none()
                : Student::query()->where('parent_id', $parentId);
        }

        if ($user->hasRole('siswa')) {
            return Student::query()->where('user_id', $user->id);
        }

        return $this->none();
    }

    /**
     * Siswa di sekumpulan industri; kosong bila profil pemanggil belum ada.
     *
     * @param  Builder<Industry>  $industries
     * @return Builder<Student>
     */
    protected function studentsAtIndustries(Builder $industries, ?int $profileId): Builder
    {
        if ($profileId === null) {
            return $this->none();
        }

        return Student::query()->whereIn('industri_id', $industries->select('id'));
    }

    /**
     * Query yang tidak pernah menghasilkan baris (cakupan kosong).
     *
     * @return Builder<Student>
     */
    protected function none(): Builder
    {
        return Student::query()->whereRaw('1 = 0');
    }
}
