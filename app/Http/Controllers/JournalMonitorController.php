<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Http\Controllers\Concerns\SummarizesStudentPerformance;
use App\Models\Activity;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Monitoring Data Jurnal berjenjang (Jurusan -> Kelas -> Murid -> rekap performa)
 * yang dibatasi cakupan role. Tanpa verifikasi — rekap berbasis hitungan.
 * Pola identik dengan AttendanceMonitorController.
 */
class JournalMonitorController extends Controller
{
    use ScopesStudentsByRole;
    use SummarizesStudentPerformance;

    /**
     * Layer 1 — daftar jurusan yang memuat siswa dalam cakupan role.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $counts = $this->scopedStudents($user)
            ->selectRaw('departemen_id, count(*) as total')
            ->groupBy('departemen_id')
            ->pluck('total', 'departemen_id');

        $departemens = Departemen::query()
            ->whereIn('id', $counts->keys())
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Departemen $departemen): array => [
                'id' => $departemen->id,
                'name' => $departemen->name,
                'students' => (int) $counts->get($departemen->id, 0),
            ]);

        return Inertia::render('journal-monitor/index', [
            'departemens' => $departemens,
        ]);
    }

    /**
     * Layer 2 — daftar kelas (dalam satu jurusan) yang memuat siswa dalam cakupan.
     */
    public function classes(Request $request, Departemen $departemen): Response
    {
        /** @var User $user */
        $user = $request->user();

        $scoped = $this->scopedStudents($user)->where('departemen_id', $departemen->id);

        $counts = $scoped
            ->selectRaw('class_id, count(*) as total')
            ->groupBy('class_id')
            ->pluck('total', 'class_id');

        abort_if($counts->isEmpty(), 403);

        $classes = Classes::query()
            ->whereIn('id', $counts->keys())
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Classes $class): array => [
                'id' => $class->id,
                'name' => $class->name,
                'students' => (int) $counts->get($class->id, 0),
            ]);

        return Inertia::render('journal-monitor/classes', [
            'departemen' => ['id' => $departemen->id, 'name' => $departemen->name],
            'classes' => $classes,
        ]);
    }

    /**
     * Layer 3 — daftar murid (dalam satu kelas) + ringkasan jurnal.
     */
    public function students(Request $request, Classes $class): Response
    {
        /** @var User $user */
        $user = $request->user();

        $search = trim((string) $request->query('search', ''));

        $scoped = $this->scopedStudents($user)->where('class_id', $class->id);

        abort_unless((clone $scoped)->exists(), 403);

        $students = $scoped
            ->withCount('activities')
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%"),
            ))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Student $student): array => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'total' => (int) $student->getAttribute('activities_count'),
            ]);

        $class->loadMissing('departemens:id,name');

        return Inertia::render('journal-monitor/students', [
            'departemen' => $class->departemens
                ? ['id' => $class->departemens->id, 'name' => $class->departemens->name]
                : null,
            'class' => ['id' => $class->id, 'name' => $class->name],
            'students' => $students,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Layer 4 — seluruh jurnal satu murid + rekap performa berbasis hitungan.
     */
    public function show(Request $request, Student $student): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->scopedStudents($user)->whereKey($student->id)->exists(), 403);

        $records = $student->activities()
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn (Activity $activity): array => $this->present($activity));

        $student->loadMissing(['classes:id,name', 'industries:id,name', 'pkl_period:id,start_period,end_period']);

        return Inertia::render('journal-monitor/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
            ],
            'records' => $records,
            'performance' => $this->performance($student),
        ]);
    }

    /**
     * Bentuk data jurnal untuk halaman Inertia (uraian HTML disanitasi saat render).
     *
     * @return array<string, mixed>
     */
    private function present(Activity $activity): array
    {
        return [
            'id' => $activity->id,
            'judul' => $activity->judul,
            'date' => $activity->date->format('Y-m-d'),
            'dateLabel' => $activity->date->translatedFormat('l, d M Y'),
            'start_time' => mb_substr($activity->start_time, 0, 5),
            'end_time' => mb_substr($activity->end_time, 0, 5),
            'description' => $activity->description,
            'tools' => $activity->tools,
            'image' => $activity->image,
        ];
    }
}
