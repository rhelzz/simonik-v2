<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Departemen;
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
        if ($user->hasAnyRole(['admin', 'wakasek'])) {
            return Student::query();
        }

        // Kaprog hanya berwenang atas program keahlian yang dipimpinnya
        // (departemens.user_id). Tanpa jurusan sama sekali berarti tanpa data,
        // bukan seluruh sekolah.
        if ($user->hasRole('kaprog')) {
            return Student::query()->whereIn(
                'departemen_id',
                Departemen::query()->where('user_id', $user->id)->select('id'),
            );
        }

        if ($user->hasRole('guru')) {
            $teacherId = $user->teachers?->id;

            if ($teacherId === null) {
                return $this->none();
            }

            // Guru pembimbing efektif = override siswa (students.teacher_id)
            // kalau ada, else ikut industries.teacher_id — sinkron dengan
            // PlacementController@index. Override menggantikan, bukan
            // menambah: siswa yang di-override ke guru lain tidak lagi
            // terlihat oleh guru industri asli.
            return Student::query()->where(function (Builder $query) use ($teacherId): void {
                $query->where('teacher_id', $teacherId)
                    ->orWhere(function (Builder $query) use ($teacherId): void {
                        $query->whereNull('teacher_id')
                            ->whereHas('industries', fn ($q) => $q->where('teacher_id', $teacherId));
                    });
            });
        }

        if ($user->hasRole('pembimbing')) {
            return $this->studentsAtIndustries(
                Industry::query()->where('pembimbing_id', $user->pembimbing?->id),
                $user->pembimbing?->id,
            );
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
     * Kalimat yang menerangkan cakupan data yang sedang dilihat.
     *
     * Pembatasan per-role terjadi diam-diam di query, sehingga pengguna tidak
     * punya cara membedakan "dibatasi" dari "datanya memang tidak ada".
     * Label ini membuat batasannya terbaca di halaman.
     */
    protected function scopeLabel(User $user): string
    {
        return match (true) {
            $user->hasAnyRole(['admin', 'wakasek']) => 'Menampilkan seluruh siswa di sekolah.',
            $user->hasRole('kaprog') => 'Menampilkan siswa pada program keahlian yang Anda pimpin.',
            $user->hasRole('guru') => 'Menampilkan hanya siswa di industri yang Anda bimbing.',
            $user->hasRole('pembimbing') => 'Menampilkan hanya siswa yang magang di industri Anda.',
            $user->hasRole('orangtua') => 'Menampilkan hanya data anak Anda.',
            default => 'Menampilkan data dalam cakupan akun Anda.',
        };
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
