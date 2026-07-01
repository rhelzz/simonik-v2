<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Attendance;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Supervisi Global & Statistik (M5.3). Rekap lintas jurusan (siswa, PKL aktif,
 * jurnal & kehadiran bulan ini) + aktivitas/cakupan bimbingan guru untuk Wakasek.
 */
class StatistikController extends Controller
{
    public function index(): Response
    {
        $monthStart = Carbon::now()->startOfMonth()->toDateString();

        $byDepartment = Departemen::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(function (Departemen $dep) use ($monthStart): array {
                $userIds = Student::query()
                    ->where('departemen_id', $dep->id)
                    ->pluck('user_id');

                return [
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
                    'journalMonth' => Activity::query()
                        ->whereIn('user_id', $userIds)
                        ->whereDate('date', '>=', $monthStart)
                        ->count(),
                    'attendanceMonth' => Attendance::query()
                        ->whereIn('user_id', $userIds)
                        ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
                        ->whereDate('date', '>=', $monthStart)
                        ->count(),
                ];
            })
            ->values()
            ->all();

        $teachers = Teacher::query()
            ->with('departements:id,name')
            ->withCount(['industries', 'students'])
            ->orderBy('name')
            ->get()
            ->map(fn (Teacher $t): array => [
                'id' => $t->id,
                'name' => $t->name,
                'department' => $t->departements?->name,
                'industries' => $t->industries_count,
                'students' => $t->students_count,
            ])
            ->values()
            ->all();

        return Inertia::render('statistik/index', [
            'byDepartment' => $byDepartment,
            'teachers' => $teachers,
            'totals' => [
                'departments' => Departemen::query()->count(),
                'students' => Student::query()->where('archived', false)->count(),
                'activePkl' => Student::query()->where('status_pkl', 'proses')->count(),
                'industries' => Industry::query()->count(),
                'teachers' => Teacher::query()->count(),
            ],
            'today' => Carbon::now()->translatedFormat('l, d F Y'),
        ]);
    }
}
