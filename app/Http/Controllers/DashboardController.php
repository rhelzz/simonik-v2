<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Models\Activity;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use ScopesStudentsByRole;

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

        if ($user->hasAnyRole(['guru', 'pembimbing', 'industri'])) {
            return $this->staffDashboard($user);
        }

        // admin / kaprog / kepala_sekolah: analitik penuh.
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
                'activePkl' => count($activeUserIds),
                'teachers' => Teacher::count(),
                'pembimbings' => Pembimbing::count(),
                'industries' => Industry::count(),
            ],
            'attendanceRate' => $participation['attendance'],
            'journalRate' => $participation['journal'],
            'recentStudents' => $this->presentStudents(
                Student::query()->with(['classes:id,name', 'industries:id,name'])->latest()->take(5),
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

        $participation = $this->participation($activeUserIds);

        return Inertia::render('dashboard-staff', [
            'stats' => [
                'students' => (clone $scoped)->count(),
                'activePkl' => count($activeUserIds),
                'pendingAttendance' => $this->pendingCount(Attendance::query(), $activeUserIds),
                'pendingJournal' => $this->pendingCount(Activity::query(), $activeUserIds),
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
            ],
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
        $activeCount = count($activeUserIds);

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
     * Jumlah catatan belum terverifikasi milik sekumpulan siswa.
     *
     * @template TModel of \Illuminate\Database\Eloquent\Model
     *
     * @param  Builder<TModel>  $query
     * @param  array<int, int>  $userIds
     */
    private function pendingCount(Builder $query, array $userIds): int
    {
        if ($userIds === []) {
            return 0;
        }

        return $query
            ->whereIn('user_id', $userIds)
            ->where(fn (Builder $q) => $q->whereNull('verified')->orWhere('verified', '0'))
            ->count();
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
