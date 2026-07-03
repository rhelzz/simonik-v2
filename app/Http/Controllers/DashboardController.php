<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesProgramByKaprog;
use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Models\Activity;
use App\Models\Attendance;
use App\Models\Badge;
use App\Models\BudgetReceipt;
use App\Models\Departemen;
use App\Models\Evaluation;
use App\Models\Expense;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use App\Services\StreakCalculator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use ScopesProgramByKaprog;
    use ScopesStudentsByRole;

    public function __construct(
        private readonly StreakCalculator $streakCalculator,
    ) {}

    /**
     * Dashboard diarahkan sesuai role pemanggil.
     */
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasRole('siswa')) {
            return $this->studentDashboard($user);
        }

        if ($user->hasRole('orangtua')) {
            return $this->parentDashboard($user);
        }

        if ($user->hasAnyRole(['guru', 'pembimbing'])) {
            return $this->staffDashboard($user);
        }

        if ($user->hasRole('wakasek')) {
            return $this->wakasekDashboard();
        }

        if ($user->hasRole('kaprog')) {
            return $this->kaprogDashboard($user);
        }

        // admin: analitik penuh.
        return $this->adminDashboard();
    }

    /**
     * Dashboard analitik penuh (admin/kaprog/kepala sekolah).
     */
    private function adminDashboard(): Response
    {
        $activeUserIds = Student::query()
            ->where('status_pkl', 'proses')
            ->pluck('user_id')
            ->all();

        $participation = $this->participation($activeUserIds);

        return Inertia::render('dashboard', [
            'stats' => [
                'students' => Student::where('archived', false)->count(),
                'activePkl' => \count($activeUserIds),
                'teachers' => Teacher::count(),
                'pembimbings' => Pembimbing::count(),
                'industries' => Industry::count(),
            ],
            'attendanceRate' => $participation['attendance'],
            'journalRate' => $participation['journal'],
            'trend' => $this->participationTrend($activeUserIds),
            'recentStudents' => $this->presentStudents(
                Student::query()->with(['classes:id,name', 'industries:id,name'])->latest()->take(5),
            ),
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }

    /**
     * Dashboard Wakasek Humas/Hubin — supervisi global: keuangan, daya tampung
     * kemitraan, partisipasi presensi/jurnal, dan rekap per jurusan.
     */
    private function wakasekDashboard(): Response
    {
        $activeUserIds = Student::query()
            ->where('status_pkl', 'proses')
            ->pluck('user_id')
            ->all();

        $participation = $this->participation($activeUserIds);

        // Akuntabilitas dana (M5.1): saldo berjalan.
        $receipts = (float) BudgetReceipt::query()->sum('amount');
        $expenses = (float) Expense::query()->sum('amount');

        // Daya tampung kemitraan (M5.2): abaikan mitra tanpa kuota.
        $withQuota = Industry::query()->whereNotNull('kuota')->withCount('students')->get();
        $capacity = (int) $withQuota->sum('kuota');
        $placed = (int) $withQuota->sum('students_count');
        $overCapacity = $withQuota
            ->filter(fn (Industry $industry): bool => $industry->students_count > (int) $industry->kuota)
            ->count();

        return Inertia::render('dashboard-wakasek', [
            'stats' => [
                'students' => Student::where('archived', false)->count(),
                'activePkl' => \count($activeUserIds),
                'industries' => Industry::count(),
                'teachers' => Teacher::count(),
            ],
            'finance' => [
                'receipts' => $receipts,
                'expenses' => $expenses,
                'balance' => $receipts - $expenses,
            ],
            'capacity' => [
                'partners' => Industry::query()->count(),
                'quota' => $capacity,
                'placed' => $placed,
                'remaining' => max(0, $capacity - $placed),
                'utilization' => $capacity > 0 ? (int) min(100, round($placed / $capacity * 100)) : 0,
                'over' => $overCapacity,
            ],
            'attendanceRate' => $participation['attendance'],
            'journalRate' => $participation['journal'],
            'byDepartment' => $this->departmentBreakdown(),
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }

    /**
     * Rekap ringkas per jurusan untuk supervisi global wakasek.
     *
     * @return array<int, array<string, mixed>>
     */
    private function departmentBreakdown(): array
    {
        return Departemen::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departemen $dep): array => [
                'id' => $dep->id,
                'name' => $dep->name,
                'students' => Student::query()
                    ->where('departemen_id', $dep->id)
                    ->where('archived', false)
                    ->count(),
                'activePkl' => Student::query()
                    ->where('departemen_id', $dep->id)
                    ->where('status_pkl', 'proses')
                    ->count(),
            ])
            ->values()
            ->all();
    }

    /**
     * Dashboard Kepala Program Keahlian — dibatasi ke jurusan yang dipimpin:
     * ringkasan penempatan, partisipasi presensi/jurnal, & siswa belum mulai PKL.
     */
    private function kaprogDashboard(User $user): Response
    {
        $depIds = $this->programDepartemenIds($user);

        $departemens = Departemen::query()
            ->whereIn('id', $depIds)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        $scoped = fn () => Student::query()->whereIn('departemen_id', $depIds);

        $activeUserIds = $scoped()
            ->where('status_pkl', 'proses')
            ->pluck('user_id')
            ->all();

        $participation = $this->participation($activeUserIds);

        return Inertia::render('dashboard-kaprog', [
            'stats' => [
                'departemens' => \count($depIds),
                'students' => $scoped()->where('archived', false)->count(),
                'activePkl' => \count($activeUserIds),
                'notStarted' => $scoped()->where('status_pkl', 'belum')->count(),
            ],
            'departemens' => $departemens,
            'attendanceRate' => $participation['attendance'],
            'journalRate' => $participation['journal'],
            'notStartedStudents' => $this->presentStudents(
                $scoped()
                    ->where('status_pkl', 'belum')
                    ->with(['classes:id,name', 'industries:id,name'])
                    ->orderBy('name')
                    ->take(6),
            ),
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }

    /**
     * Dashboard ringkas untuk staf pembina (guru/pembimbing/industri) —
     * dibatasi ke siswa dalam cakupannya.
     */
    private function staffDashboard(User $user): Response
    {
        $scoped = $this->scopedStudents($user);

        $activeUserIds = (clone $scoped)
            ->where('status_pkl', 'proses')
            ->pluck('user_id')
            ->all();

        $studentIds = (clone $scoped)->pluck('id');

        $participation = $this->participation($activeUserIds);

        $avgRaw = Evaluation::query()->whereIn('student_id', $studentIds)->avg('score');

        return Inertia::render('dashboard-staff', [
            'stats' => [
                'students' => (clone $scoped)->count(),
                'activePkl' => \count($activeUserIds),
                'assessed' => Evaluation::query()->whereIn('student_id', $studentIds)->distinct()->count('student_id'),
                'avgScore' => $avgRaw === null ? null : (int) round((float) $avgRaw),
            ],
            'attendanceRate' => $participation['attendance'],
            'journalRate' => $participation['journal'],
            'recentStudents' => $this->presentStudents(
                (clone $scoped)->with(['classes:id,name', 'industries:id,name'])->latest()->take(5),
            ),
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }

    /**
     * Dashboard pribadi siswa.
     */
    private function studentDashboard(User $user): Response
    {
        $student = $user->students;
        $userId = (int) $user->id;
        $monthStart = Carbon::now()->startOfMonth()->toDateString();

        $today = Attendance::query()
            ->where('user_id', $userId)
            ->whereDate('date', Carbon::today())
            ->first();

        $avgRaw = $student === null
            ? null
            : Evaluation::query()->where('student_id', $student->id)->avg('score');
        $avg = $avgRaw === null ? null : (int) round((float) $avgRaw);

        $student?->loadMissing(['industries:id,name', 'pkl_period:id,name_period']);

        $streaks = $this->streakCalculator->calculate($user);

        $allBadges = Badge::all();

        // Keyed by badge_id for O(1) lookups without pivot magic access.
        $pivotRows = $student !== null
            ? \DB::table('student_badge')
                ->where('student_id', $student->id)
                ->get(['badge_id', 'awarded_at'])
                ->keyBy('badge_id')
            : collect();

        $badges = $allBadges->map(fn (Badge $b) => [
            'id' => $b->id,
            'key' => $b->key,
            'name' => $b->name,
            'description' => $b->description,
            'icon' => $b->icon,
            'color' => $b->color,
            'rule_type' => $b->rule_type,
            'rule_value' => $b->rule_value,
            'earned' => $pivotRows->has($b->id),
            'awarded_at' => $pivotRows->has($b->id)
                ? (string) $pivotRows->get($b->id)->awarded_at
                : null,
        ])->values()->all();

        return Inertia::render('dashboard-student', [
            'profile' => [
                'industry' => $student?->industries?->name,
                'status_pkl' => $student?->status_pkl,
                'period' => $student?->pkl_period?->name_period,
            ],
            'todayStatus' => $today?->status,
            'stats' => [
                'attendanceMonth' => Attendance::query()
                    ->where('user_id', $userId)
                    ->whereDate('date', '>=', $monthStart)
                    ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
                    ->distinct()
                    ->count('date'),
                'journalMonth' => Activity::query()
                    ->where('user_id', $userId)
                    ->whereDate('date', '>=', $monthStart)
                    ->count(),
                'journalTotal' => Activity::query()->where('user_id', $userId)->count(),
                'avg' => $avg,
                'grade' => Evaluation::gradeFor($avg),
                'current_streak' => $streaks['current_streak'],
                'longest_streak' => $streaks['longest_streak'],
            ],
            'badges' => $badges,
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }

    /**
     * Dashboard orang tua — ringkasan tiap anak.
     */
    private function parentDashboard(User $user): Response
    {
        $monthStart = Carbon::now()->startOfMonth()->toDateString();

        $children = $this->scopedStudents($user)
            ->with(['classes:id,name', 'industries:id,name'])
            ->orderBy('name')
            ->get()
            ->map(function (Student $child) use ($monthStart): array {
                $avgRaw = Evaluation::query()->where('student_id', $child->id)->avg('score');
                $avg = $avgRaw === null ? null : (int) round((float) $avgRaw);

                return [
                    'id' => $child->id,
                    'name' => $child->name,
                    'nis' => $child->nis,
                    'class' => $child->classes?->name,
                    'industry' => $child->industries?->name,
                    'status_pkl' => $child->status_pkl,
                    'attendanceMonth' => Attendance::query()
                        ->where('user_id', $child->user_id)
                        ->whereDate('date', '>=', $monthStart)
                        ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
                        ->distinct()
                        ->count('date'),
                    'journalMonth' => Activity::query()
                        ->where('user_id', $child->user_id)
                        ->whereDate('date', '>=', $monthStart)
                        ->count(),
                    'grade' => Evaluation::gradeFor($avg),
                ];
            });

        return Inertia::render('dashboard-parent', [
            'children' => $children,
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }

    /**
     * Hitung rate absensi & jurnal untuk sekumpulan siswa aktif.
     *
     * @param  array<int, int>  $activeUserIds
     * @return array{attendance: array{today: int, week: int, month: int, all: int}, journal: array{today: int, week: int, month: int, all: int}}
     */
    private function participation(array $activeUserIds): array
    {
        $activeCount = \count($activeUserIds);

        $attendanceDays = $activeCount === 0 ? [] : Attendance::query()
            ->whereIn('user_id', $activeUserIds)
            ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
            ->get(['user_id', 'date'])
            ->map(fn (Attendance $row): array => ['u' => $row->user_id, 'd' => $row->date->format('Y-m-d')])
            ->all();

        $journalDays = $activeCount === 0 ? [] : Activity::query()
            ->whereIn('user_id', $activeUserIds)
            ->get(['user_id', 'date'])
            ->map(fn (Activity $row): array => ['u' => $row->user_id, 'd' => $row->date->format('Y-m-d')])
            ->all();

        return [
            'attendance' => $this->rates($attendanceDays, $activeCount),
            'journal' => $this->rates($journalDays, $activeCount),
        ];
    }

    /**
     * Tren jumlah absensi & pengisian jurnal siswa aktif untuk grafik dashboard
     * yang bisa di-toggle: masing-masing per-minggu (7 titik harian) dan
     * per-bulan (4 titik mingguan).
     *
     * @param  array<int, int>  $activeUserIds
     * @return array{
     *     attendance: array{
     *         week: array{total: int, points: array<int, array{label: string, value: int}>},
     *         month: array{total: int, points: array<int, array{label: string, value: int}>}
     *     },
     *     journal: array{
     *         week: array{total: int, points: array<int, array{label: string, value: int}>},
     *         month: array{total: int, points: array<int, array{label: string, value: int}>}
     *     }
     * }
     */
    private function participationTrend(array $activeUserIds): array
    {
        $now = Carbon::now();
        $windowStart = $now->copy()->subDays(27)->startOfDay()->toDateString();

        $attendanceDates = empty($activeUserIds) ? [] : Attendance::query()
            ->whereIn('user_id', $activeUserIds)
            ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
            ->whereDate('date', '>=', $windowStart)
            ->get(['date'])
            ->map(fn (Attendance $row): string => $row->date->format('Y-m-d'))
            ->all();

        $journalDates = empty($activeUserIds) ? [] : Activity::query()
            ->whereIn('user_id', $activeUserIds)
            ->whereDate('date', '>=', $windowStart)
            ->get(['date'])
            ->map(fn (Activity $row): string => $row->date->format('Y-m-d'))
            ->all();

        return [
            'attendance' => $this->buildTrend($attendanceDates, $now),
            'journal' => $this->buildTrend($journalDates, $now),
        ];
    }

    /**
     * Rangkum daftar tanggal menjadi tren mingguan (7 titik) & bulanan (4 titik).
     *
     * @param  array<int, string>  $dates  daftar tanggal 'Y-m-d' (boleh duplikat)
     * @return array{
     *     week: array{total: int, points: array<int, array{label: string, value: int}>},
     *     month: array{total: int, points: array<int, array{label: string, value: int}>}
     * }
     */
    private function buildTrend(array $dates, Carbon $now): array
    {
        /** @var array<string, int> $countByDate */
        $countByDate = [];
        foreach ($dates as $date) {
            $countByDate[$date] = ($countByDate[$date] ?? 0) + 1;
        }

        // Per-minggu: 7 hari terakhir termasuk hari ini.
        $dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        $week = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = $now->copy()->subDays($i);
            $week[] = [
                'label' => $dayLabels[$day->dayOfWeek],
                'value' => $countByDate[$day->format('Y-m-d')] ?? 0,
            ];
        }

        // Per-bulan: 4 bucket 7-harian, minggu terlama lebih dulu.
        $month = [];
        for ($w = 3; $w >= 0; $w--) {
            $start = $now->copy()->subDays(($w + 1) * 7 - 1)->format('Y-m-d');
            $end = $now->copy()->subDays($w * 7)->format('Y-m-d');
            $sum = 0;
            foreach ($countByDate as $date => $count) {
                if ($date >= $start && $date <= $end) {
                    $sum += $count;
                }
            }
            $month[] = [
                'label' => 'Minggu '.(4 - $w),
                'value' => $sum,
            ];
        }

        return [
            'week' => [
                'total' => array_sum(array_column($week, 'value')),
                'points' => $week,
            ],
            'month' => [
                'total' => array_sum(array_column($month, 'value')),
                'points' => $month,
            ],
        ];
    }

    /**
     * Bentuk daftar siswa untuk kartu/tabel dashboard.
     *
     * @param  Builder<Student>  $query
     * @return array<int, array<string, mixed>>
     */
    private function presentStudents(Builder $query): array
    {
        return $query
            ->get(['id', 'name', 'nis', 'status_pkl', 'class_id', 'industri_id', 'created_at'])
            ->map(fn (Student $student): array => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'status_pkl' => $student->status_pkl,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
                'joined' => $student->created_at?->translatedFormat('d M Y'),
            ])
            ->all();
    }

    /**
     * Persentase partisipasi (kehadiran/jurnal) per rentang waktu.
     *
     * @param  array<int, array{u: int, d: string}>  $days
     * @return array{today: int, week: int, month: int, all: int}
     */
    private function rates(array $days, int $activeCount): array
    {
        $now = Carbon::now();
        $today = $now->toDateString();
        $weekStart = $now->copy()->startOfWeek()->toDateString();
        $monthStart = $now->copy()->startOfMonth()->toDateString();

        // Tanggal pertama ada data (sebagai proxy kapan PKL benar-benar dimulai).
        $allDates = array_column($days, 'd');
        $firstDate = empty($allDates) ? $today : min($allDates);

        return [
            'today' => $this->rate(
                array_filter($days, fn (array $row): bool => $row['d'] === $today),
                $activeCount,
                1,
            ),
            'week' => $this->rate(
                array_filter($days, fn (array $row): bool => $row['d'] >= $weekStart),
                $activeCount,
                $this->weekdaysBetween(max($weekStart, $firstDate), $today),
            ),
            'month' => $this->rate(
                array_filter($days, fn (array $row): bool => $row['d'] >= $monthStart),
                $activeCount,
                $this->weekdaysBetween(max($monthStart, $firstDate), $today),
            ),
            'all' => $this->rate(
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
    private function rate(array $days, int $activeCount, int $effectiveDays): int
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
