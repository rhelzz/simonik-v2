<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Models\Attendance;
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
 * Monitoring Data Absen berjenjang (Jurusan -> Kelas -> Murid -> detail) yang
 * dibatasi cakupan role, plus verifikasi absen oleh pembimbing/industri.
 */
class AttendanceMonitorController extends Controller
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

        return Inertia::render('attendance-monitor/index', [
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

        return Inertia::render('attendance-monitor/classes', [
            'departemen' => ['id' => $departemen->id, 'name' => $departemen->name],
            'classes' => $classes,
        ]);
    }

    /**
     * Layer 3 — daftar murid (dalam satu kelas) + ringkasan absen.
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
                'attendances',
                'attendances as pending_count' => fn (Builder $query) => $query->where(
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
                'total' => (int) $student->getAttribute('attendances_count'),
                'pending' => (int) $student->getAttribute('pending_count'),
            ]);

        $class->loadMissing('departemens:id,name');

        return Inertia::render('attendance-monitor/students', [
            'departemen' => $class->departemens
                ? ['id' => $class->departemens->id, 'name' => $class->departemens->name]
                : null,
            'class' => ['id' => $class->id, 'name' => $class->name],
            'students' => $students,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Layer 4 — seluruh data absen satu murid + ringkasan, beserta hak verifikasi.
     */
    public function show(Request $request, Student $student): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->scopedStudents($user)->whereKey($student->id)->exists(), 403);

        $records = $student->attendances()
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(15)
            ->through(fn (Attendance $attendance): array => $this->present($attendance));

        $summary = $student->attendances()
            ->selectRaw('lower(status) as label, count(*) as total')
            ->groupBy('label')
            ->pluck('total', 'label');

        $student->loadMissing(['classes:id,name', 'industries:id,name']);

        return Inertia::render('attendance-monitor/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
            ],
            'records' => $records,
            'summary' => [
                'hadir' => (int) ($summary->get('hadir', 0) + $summary->get('masuk', 0)),
                'izin' => (int) $summary->get('izin', 0),
                'sakit' => (int) $summary->get('sakit', 0),
                'alpha' => (int) $summary->get('alpha', 0),
            ],
            'canVerify' => $user->hasAnyRole(['pembimbing', 'industri', 'mitra']),
        ]);
    }

    /**
     * Verifikasi (atau batalkan) satu catatan absen. Hanya pembimbing/industri,
     * dan hanya untuk siswa dalam cakupannya.
     */
    public function verify(Request $request, Attendance $attendance): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            $this->scopedStudents($user)->where('user_id', $attendance->user_id)->exists(),
            403,
        );

        $verified = $attendance->verified === '1';
        $attendance->update(['verified' => $verified ? '0' : '1']);

        return back()->with(
            'success',
            $verified ? 'Verifikasi dibatalkan.' : 'Absen berhasil diverifikasi.',
        );
    }

    /**
     * Bentuk data absen untuk dikirim ke halaman Inertia.
     *
     * @return array<string, mixed>
     */
    private function present(Attendance $attendance): array
    {
        return [
            'id' => $attendance->id,
            'date' => $attendance->date->format('Y-m-d'),
            'dateLabel' => $attendance->date->translatedFormat('l, d M Y'),
            'status' => $attendance->status,
            'arrivalTime' => $attendance->arrivalTime ? mb_substr($attendance->arrivalTime, 0, 5) : null,
            'departureTime' => $attendance->departureTime ? mb_substr($attendance->departureTime, 0, 5) : null,
            'absenceReason' => $attendance->absenceReason,
            'image' => $attendance->image,
            'latitude' => $attendance->latitude,
            'longitude' => $attendance->longitude,
            'verified' => $attendance->verified === '1',
        ];
    }
}
