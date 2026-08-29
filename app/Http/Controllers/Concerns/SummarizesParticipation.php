<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Activity;
use App\Models\Attendance;
use Illuminate\Support\Carbon;

/**
 * Rate partisipasi (absensi & jurnal) sekumpulan siswa aktif, per rentang
 * waktu. Dipakai dashboard (admin/wakasek/kaprog/staff) dan halaman Data Absen.
 *
 * Penamaan method sengaja dibedakan dari SummarizesStudentPerformance yang
 * juga punya rate() — keduanya dipakai bersama di AttendanceMonitorController,
 * dan nama yang sama akan bertabrakan saat trait digabung.
 */
trait SummarizesParticipation
{
    /**
     * Hitung rate absensi & jurnal untuk sekumpulan siswa aktif.
     *
     * @param  array<int, int>  $activeUserIds
     * @return array{attendance: array{today: int, week: int, month: int, all: int}, journal: array{today: int, week: int, month: int, all: int}}
     */
    protected function participation(array $activeUserIds): array
    {
        $activeCount = \count($activeUserIds);

        $attendanceDays = $activeCount === 0 ? [] : Attendance::query()
            ->whereIn('user_id', $activeUserIds)
            ->countedPresent()
            ->get(['user_id', 'date'])
            ->map(fn (Attendance $row): array => ['u' => $row->user_id, 'd' => $row->date->format('Y-m-d')])
            ->all();

        $journalDays = $activeCount === 0 ? [] : Activity::query()
            ->whereIn('user_id', $activeUserIds)
            ->get(['user_id', 'date'])
            ->map(fn (Activity $row): array => ['u' => $row->user_id, 'd' => $row->date->format('Y-m-d')])
            ->all();

        return [
            'attendance' => $this->participationRates($attendanceDays, $activeCount),
            'journal' => $this->participationRates($journalDays, $activeCount),
        ];
    }

    /**
     * Persentase partisipasi (kehadiran/jurnal) per rentang waktu.
     *
     * @param  array<int, array{u: int, d: string}>  $days
     * @return array{today: int, week: int, month: int, all: int}
     */
    private function participationRates(array $days, int $activeCount): array
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $weekStart = $now->copy()->startOfWeek()->toDateString();
        $monthStart = $now->copy()->startOfMonth()->toDateString();

        // Tanggal pertama ada data (sebagai proxy kapan PKL benar-benar dimulai).
        $allDates = array_column($days, 'd');
        $firstDate = empty($allDates) ? $today : min($allDates);

        return [
            'today' => $this->participationRate(
                array_filter($days, fn (array $row): bool => $row['d'] === $today),
                $activeCount,
                1,
            ),
            'week' => $this->participationRate(
                array_filter($days, fn (array $row): bool => $row['d'] >= $weekStart),
                $activeCount,
                $this->weekdaysBetween(max($weekStart, $firstDate), $today),
            ),
            'month' => $this->participationRate(
                array_filter($days, fn (array $row): bool => $row['d'] >= $monthStart),
                $activeCount,
                $this->weekdaysBetween(max($monthStart, $firstDate), $today),
            ),
            'all' => $this->participationRate(
                $days,
                $activeCount,
                $this->weekdaysBetween($firstDate, $today),
            ),
        ];
    }

    /**
     * Hitung jumlah hari kerja (Senin–Jumat) antara dua tanggal, inklusif kedua ujung.
     */
    private function weekdaysBetween(string $from, string $to): int
    {
        $start = Carbon::parse($from)->startOfDay();
        $end = Carbon::parse($to)->startOfDay();

        if ($start->gt($end)) {
            return 0;
        }

        $totalDays = (int) $start->diffInDays($end) + 1;
        $startDow = $start->dayOfWeek; // 0=Sun … 6=Sat

        $weekdays = (int) floor($totalDays / 7) * 5;
        $remainder = $totalDays % 7;

        for ($i = 0; $i < $remainder; $i++) {
            $dow = ($startDow + $i) % 7;
            if ($dow !== 0 && $dow !== 6) {
                $weekdays++;
            }
        }

        return $weekdays;
    }

    /**
     * Rasio hari-siswa aktif / (siswa aktif × jumlah hari efektif), dibatasi 100%.
     *
     * @param  array<int, array{u: int, d: string}>  $days
     */
    private function participationRate(array $days, int $activeCount, int $effectiveDays): int
    {
        if ($activeCount === 0 || $effectiveDays <= 0) {
            return 0;
        }

        $studentDays = \count(array_unique(
            array_map(fn (array $row): string => $row['u'].'|'.$row['d'], $days),
        ));

        return (int) min(100, (int) round($studentDays / ($activeCount * $effectiveDays) * 100));
    }
}
