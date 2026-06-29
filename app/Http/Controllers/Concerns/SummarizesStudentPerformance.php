<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Evaluation;
use App\Models\Student;
use Carbon\CarbonInterface;
use Illuminate\Support\Carbon;

/**
 * Membangun rekap performa seorang siswa PKL berbasis hitungan (count) —
 * menggantikan mekanisme verifikasi. Dipakai monitoring (Data Absen/Jurnal)
 * dan halaman "Industri Saya" milik pembimbing.
 */
trait SummarizesStudentPerformance
{
    /**
     * Rekap performa: hitungan kehadiran & jurnal, persentase (rate), serta
     * nilai rata-rata + grade (diisi manual pembimbing, biasanya di akhir PKL).
     *
     * @return array{
     *     attendance: array{hadir: int, izin: int, sakit: int, alpha: int, total: int},
     *     journal: array{total: int},
     *     attendanceRate: int,
     *     journalRate: int,
     *     effectiveDays: int,
     *     avg: int|null,
     *     grade: string|null
     * }
     */
    protected function performance(Student $student): array
    {
        $statusCounts = $student->attendances()
            ->selectRaw('lower(status) as label, count(*) as total')
            ->groupBy('label')
            ->pluck('total', 'label');

        $hadir = (int) ($statusCounts->get('hadir', 0) + $statusCounts->get('masuk', 0));

        $hadirDays = $student->attendances()
            ->whereRaw('lower(status) in (?, ?)', ['hadir', 'masuk'])
            ->distinct()
            ->count('date');

        $journalDays = $student->activities()->distinct()->count('date');

        $effectiveDays = $this->effectiveWorkdays($student, $hadirDays, $journalDays);

        $avgRaw = Evaluation::query()->where('student_id', $student->id)->avg('score');
        $avg = $avgRaw === null ? null : (int) round((float) $avgRaw);

        return [
            'attendance' => [
                'hadir' => $hadir,
                'izin' => (int) $statusCounts->get('izin', 0),
                'sakit' => (int) $statusCounts->get('sakit', 0),
                'alpha' => (int) $statusCounts->get('alpha', 0),
                'total' => $student->attendances()->count(),
            ],
            'journal' => [
                'total' => $student->activities()->count(),
            ],
            'attendanceRate' => $this->rate($hadirDays, $effectiveDays),
            'journalRate' => $this->rate($journalDays, $effectiveDays),
            'effectiveDays' => $effectiveDays,
            'avg' => $avg,
            'grade' => Evaluation::gradeFor($avg),
        ];
    }

    /**
     * Hari kerja efektif sebagai penyebut rate: jumlah weekday dari awal PKL
     * sampai hari ini (atau akhir PKL bila sudah lewat). Bila tanggal PKL belum
     * diisi, jatuh ke jumlah hari tercatat (absen/jurnal) agar rate tetap wajar.
     */
    private function effectiveWorkdays(Student $student, int $hadirDays, int $journalDays): int
    {
        $start = $student->pkl_start ?? $student->pkl_period?->start_period;
        $end = $student->pkl_end ?? $student->pkl_period?->end_period;

        if ($start !== null) {
            $today = Carbon::today();
            $rangeEnd = $end !== null && $end->lessThan($today) ? $end : $today;

            $workdays = $this->countWeekdays($start, $rangeEnd);

            if ($workdays > 0) {
                return $workdays;
            }
        }

        return max($hadirDays, $journalDays);
    }

    /**
     * Jumlah hari kerja (Senin–Jumat) dalam rentang inklusif. Aman untuk
     * instance Carbon mutable maupun immutable (date cast = CarbonImmutable).
     */
    private function countWeekdays(CarbonInterface $start, CarbonInterface $end): int
    {
        if ($start->greaterThan($end)) {
            return 0;
        }

        $count = 0;
        $cursor = $start->copy();

        while ($cursor->lessThanOrEqualTo($end)) {
            if (! $cursor->isWeekend()) {
                $count++;
            }
            $cursor = $cursor->addDay();
        }

        return $count;
    }

    /**
     * Persentase (0–100) dari hari terpenuhi atas hari kerja efektif.
     */
    private function rate(int $fulfilled, int $effectiveDays): int
    {
        if ($effectiveDays <= 0) {
            return 0;
        }

        return (int) min(100, (int) round($fulfilled / $effectiveDays * 100));
    }
}
