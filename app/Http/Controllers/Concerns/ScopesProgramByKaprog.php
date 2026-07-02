<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Departemen;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Membatasi data ke lingkup program keahlian (jurusan) seorang Kaprog.
 * Admin melihat seluruh jurusan; kaprog hanya jurusan yang dipimpinnya
 * (relasi departemens.user_id). Dipakai dashboard & plotting penempatan.
 */
trait ScopesProgramByKaprog
{
    /**
     * ID jurusan dalam cakupan pengguna. Admin = semua jurusan.
     *
     * @return array<int, int>
     */
    protected function programDepartemenIds(User $user): array
    {
        if ($user->hasRole('admin')) {
            return Departemen::query()->pluck('id')->all();
        }

        return $user->departements()->pluck('id')->all();
    }

    /**
     * Query siswa dalam cakupan program keahlian pengguna.
     *
     * @return Builder<Student>
     */
    protected function programStudents(User $user): Builder
    {
        return Student::query()->whereIn('departemen_id', $this->programDepartemenIds($user));
    }
}
