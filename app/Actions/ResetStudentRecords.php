<?php

namespace App\Actions;

use App\Models\Approval;
use App\Models\Attendance;
use App\Models\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Hapus permanen data absen / jurnal milik siswa, dibatasi kriteria yang
 * dipilih operator.
 *
 * Dipakai dua tempat: reset Data Absen (v2.4 Fase 19) dan reset Data Jurnal
 * (Fase 20) — keduanya berbentuk sama (`user_id` + `date`), sehingga satu
 * action memenuhi syarat "abstraksi hanya kalau dipakai >=2 tempat".
 *
 * KEAMANAN: action ini TIDAK PERNAH membangun kuerinya sendiri dari
 * `Student::query()`. Ia selalu menerima builder yang SUDAH dibatasi cakupan
 * role oleh pemanggil (`ScopesStudentsByRole::scopedStudents()`). Kalau ia
 * boleh membuat kuerinya sendiri, suatu hari seseorang akan memanggilnya tanpa
 * scoping dan seorang guru bisa menghapus data satu sekolah.
 *
 * ponytail: hard delete tanpa undo. SoftDeletes akan mengubah semantik SETIAP
 * kueri absen/jurnal di seluruh aplikasi (dashboard, monitoring, rapor,
 * sertifikat, badge) demi fitur sekali-per-semester. Tambahkan hanya kalau ada
 * insiden salah-reset yang nyata.
 */
class ResetStudentRecords
{
    /**
     * Berapa baris yang AKAN terhapus — untuk pratinjau, tidak mengubah apa pun.
     *
     * @param  Builder<Student>  $scopedStudents  wajib sudah dibatasi cakupan role
     * @param  class-string<Model>  $model  Attendance::class | Activity::class
     * @param  array<string, mixed>  $criteria
     */
    public function count(Builder $scopedStudents, string $model, array $criteria): int
    {
        return $this->query($scopedStudents, $model, $criteria)->count();
    }

    /**
     * Hapus permanen dan kembalikan jumlah baris yang terhapus.
     *
     * @param  Builder<Student>  $scopedStudents  wajib sudah dibatasi cakupan role
     * @param  class-string<Model>  $model  Attendance::class | Activity::class
     * @param  array<string, mixed>  $criteria
     */
    public function handle(Builder $scopedStudents, string $model, array $criteria): int
    {
        $query = $this->query($scopedStudents, $model, $criteria);

        return DB::transaction(function () use ($query, $model): int {
            if ($model === Attendance::class) {
                // Approval bersifat polimorfik — TIDAK ada foreign key ke
                // attendances, jadi database tidak melakukan cascade apa pun,
                // dan ->delete() pada query builder tidak memicu event model.
                //
                // Tanpa baris ini, Inbox Persetujuan akan memuat approval yatim
                // dan ApprovalController::index() FATAL saat memanggil
                // $approvable->users->name pada approvable yang sudah null.
                Approval::query()
                    ->where('approvable_type', Attendance::class)
                    ->whereIn('approvable_id', (clone $query)->select('id'))
                    ->delete();
            }

            // Dua DELETE harus berhasil bersama: separuh terhapus (baris absen
            // hilang tapi approval-nya tinggal) lebih buruk daripada gagal.
            return $query->delete();
        });
    }

    /**
     * Satu pembangun kueri untuk count() DAN handle(), supaya pratinjau tidak
     * mungkin menghitung himpunan yang berbeda dari yang dihapus — bug paling
     * berbahaya di fitur ini.
     *
     * @param  Builder<Student>  $scopedStudents
     * @param  class-string<Model>  $model
     * @param  array<string, mixed>  $criteria
     * @return Builder<Model>
     */
    private function query(Builder $scopedStudents, string $model, array $criteria): Builder
    {
        $students = (clone $scopedStudents)
            ->when(
                ($criteria['departemen_id'] ?? null) !== null,
                fn (Builder $query): Builder => $query->where('departemen_id', $criteria['departemen_id']),
            )
            ->when(
                ($criteria['class_id'] ?? null) !== null,
                fn (Builder $query): Builder => $query->where('class_id', $criteria['class_id']),
            )
            ->when(
                ($criteria['industri_id'] ?? null) !== null,
                fn (Builder $query): Builder => $query->where('industri_id', $criteria['industri_id']),
            )
            // Murid tertentu disaring LEWAT $scopedStudents, bukan langsung ke
            // tabel absen — inilah yang membuat ID murid sekolah lain yang
            // dikirim dari devtools menghasilkan 0 baris, bukan bencana.
            ->when(
                ! empty($criteria['student_ids']),
                fn (Builder $query): Builder => $query->whereIn('id', $criteria['student_ids']),
            );

        return $model::query()
            // Sub-kueri, bukan ->pluck(): pluck akan menarik ribuan ID ke
            // memori PHP lalu mengirimnya balik sebagai literal IN(...) raksasa.
            ->whereIn('user_id', $students->select('user_id'))
            ->when(
                ($criteria['from'] ?? null) !== null,
                fn (Builder $query): Builder => $query->whereDate('date', '>=', $criteria['from']),
            )
            ->when(
                ($criteria['to'] ?? null) !== null,
                fn (Builder $query): Builder => $query->whereDate('date', '<=', $criteria['to']),
            );
    }
}
