<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Models\Activity;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Monitoring Data Jurnal berjenjang (Jurusan -> Kelas -> Murid -> detail) yang
 * dibatasi cakupan role, plus verifikasi jurnal oleh pembimbing/industri.
 * Pola identik dengan AttendanceMonitorController.
 */
class JournalMonitorController extends Controller
{
    use ScopesStudentsByRole;

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
            ->withCount([
                'activities',
                'activities as pending_count' => fn (Builder $query) => $query->where(
                    fn (Builder $q) => $q->whereNull('verified')->orWhere('verified', '0'),
                ),
            ])
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
                'pending' => (int) $student->getAttribute('pending_count'),
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
     * Layer 4 — seluruh jurnal satu murid + hak verifikasi.
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

        $total = $student->activities()->count();
        $verified = $student->activities()->where('verified', '1')->count();

        $student->loadMissing(['classes:id,name', 'industries:id,name']);

        return Inertia::render('journal-monitor/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
            ],
            'records' => $records,
            'summary' => [
                'total' => $total,
                'verified' => $verified,
                'pending' => $total - $verified,
            ],
            'canVerify' => $user->hasAnyRole(['pembimbing', 'industri', 'mitra']),
        ]);
    }

    /**
     * Verifikasi (atau batalkan) satu jurnal. Hanya pembimbing/industri, dan
     * hanya untuk siswa dalam cakupannya.
     */
    public function verify(Request $request, Activity $activity): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            $this->scopedStudents($user)->where('user_id', $activity->user_id)->exists(),
            403,
        );

        $verified = $activity->verified === '1';
        $activity->update(['verified' => $verified ? '0' : '1']);

        return back()->with(
            'success',
            $verified ? 'Verifikasi dibatalkan.' : 'Jurnal berhasil diverifikasi.',
        );
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
            'verified' => $activity->verified === '1',
        ];
    }
}
