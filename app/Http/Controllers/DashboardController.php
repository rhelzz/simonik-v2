<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Attendance;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Dashboard analitik monitoring PKL untuk admin.
     */
    public function __invoke(): Response
    {
        $activeUserIds = Student::query()
            ->where('status_pkl', 'proses')
            ->pluck('user_id')
            ->all();
        $activeCount = count($activeUserIds);

        // Hari kehadiran (status hadir/masuk) milik siswa yang sedang PKL.
        $attendanceDays = $activeCount === 0 ? [] : Attendance::query()
            ->whereIn('user_id', $activeUserIds)
            ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
            ->get(['user_id', 'date'])
            ->map(fn (Attendance $row): array => [
                'u' => $row->user_id,
                'd' => $row->date->format('Y-m-d'),
            ])
            ->values()
            ->all();

        // Hari pengisian jurnal milik siswa yang sedang PKL.
        $journalDays = $activeCount === 0 ? [] : Activity::query()
            ->whereIn('user_id', $activeUserIds)
            ->get(['user_id', 'date'])
            ->map(fn (Activity $row): array => [
                'u' => $row->user_id,
                'd' => $row->date->format('Y-m-d'),
            ])
            ->values()
            ->all();

        return Inertia::render('dashboard', [
            'stats' => [
                'students' => Student::where('archived', false)->count(),
                'activePkl' => $activeCount,
                'teachers' => Teacher::count(),
                'pembimbings' => Pembimbing::count(),
                'industries' => Industry::count(),
            ],
            'attendanceRate' => $this->rates($attendanceDays, $activeCount),
            'journalRate' => $this->rates($journalDays, $activeCount),
            'recentStudents' => Student::with(['classes:id,name', 'industries:id,name'])
                ->latest()
                ->take(5)
                ->get(['id', 'name', 'nis', 'status_pkl', 'class_id', 'industri_id', 'created_at'])
                ->map(fn (Student $student): array => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nis,
                    'status_pkl' => $student->status_pkl,
                    'class' => $student->classes?->name,
                    'industry' => $student->industries?->name,
                    'joined' => $student->created_at?->translatedFormat('d M Y'),
                ]),
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }

    /**
     * Persentase partisipasi (kehadiran/jurnal) per rentang waktu.
     *
     * @param  array<int, array{u: int, d: string}>  $days  pasangan user-id & tanggal (Y-m-d)
     * @return array{today: int, week: int, month: int, all: int}
     */
    private function rates(array $days, int $activeCount): array
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $weekStart = $now->copy()->startOfWeek()->toDateString();
        $monthStart = $now->copy()->startOfMonth()->toDateString();

        return [
            'today' => $this->rate(
                array_filter($days, fn (array $row): bool => $row['d'] === $today),
                $activeCount,
                1,
            ),
            'week' => $this->rate(
                array_filter($days, fn (array $row): bool => $row['d'] >= $weekStart),
                $activeCount,
                (int) $now->copy()->startOfWeek()->diffInDays($now) + 1,
            ),
            'month' => $this->rate(
                array_filter($days, fn (array $row): bool => $row['d'] >= $monthStart),
                $activeCount,
                $now->day,
            ),
            'all' => $this->rate(
                $days,
                $activeCount,
                count(array_unique(array_column($days, 'd'))),
            ),
        ];
    }

    /**
     * Rasio hari-siswa aktif / (siswa aktif × jumlah hari efektif), dibatasi 100%.
     *
     * @param  array<int, array{u: int, d: string}>  $days
     */
    private function rate(array $days, int $activeCount, int $effectiveDays): int
    {
        if ($activeCount === 0 || $effectiveDays <= 0) {
            return 0;
        }

        $studentDays = count(array_unique(
            array_map(fn (array $row): string => $row['u'].'|'.$row['d'], $days),
        ));

        return (int) min(100, (int) round($studentDays / ($activeCount * $effectiveDays) * 100));
    }
}
