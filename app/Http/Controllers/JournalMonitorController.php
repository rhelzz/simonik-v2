<?php

namespace App\Http\Controllers;

use App\Actions\ResetStudentRecords;
use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Http\Controllers\Concerns\SummarizesStudentPerformance;
use App\Http\Requests\PreviewResetRecordsRequest;
use App\Http\Requests\ResetRecordsRequest;
use App\Models\Activity;
use App\Models\Classes;
use App\Models\Departemen;
use App\Models\Industry;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
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
     * Batas jumlah murid yang ditawarkan di modal reset. Sekolah besar bisa
     * punya ribuan siswa; mengirim semuanya membuat modal berat tanpa ada yang
     * benar-benar menggulir sejauh itu.
     */
    private const RESET_CANDIDATE_LIMIT = 200;

    public function __construct(private readonly ResetStudentRecords $reset) {}

    /**
     * Pratinjau: berapa baris jurnal yang AKAN terhapus. Tidak mengubah apa pun.
     *
     * Alasan JSON (bukan Inertia render) sama dengan padanannya di
     * AttendanceMonitorController: dipanggil berkali-kali di dalam modal yang
     * sedang terbuka.
     */
    public function resetPreview(PreviewResetRecordsRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $criteria = $request->validated();

        // Kandidat murid dihitung TANPA student_ids: daftar yang ditawarkan
        // harus tetap sama saat operator mencentang sebagian, kalau tidak
        // daftarnya menyusut sendiri setiap kali dicentang.
        $candidates = $this->reset
            ->students($this->scopedStudents($user), Arr::except($criteria, 'student_ids'))
            ->orderBy('name')
            ->limit(self::RESET_CANDIDATE_LIMIT)
            ->get(['id', 'name', 'nis']);

        return response()->json([
            'count' => $this->reset->count(
                $this->scopedStudents($user),
                Activity::class,
                $criteria,
            ),
            'students' => $candidates,
            // Beri tahu modal kalau daftarnya dipotong, agar operator tahu
            // harus mempersempit filter — bukan mengira muridnya cuma segitu.
            'truncated' => $candidates->count() >= self::RESET_CANDIDATE_LIMIT,
        ]);
    }

    /**
     * Hapus permanen data jurnal sesuai kriteria. Tidak bisa dibatalkan.
     *
     * Activity::class, BUKAN Attendance::class — satu class-string yang lupa
     * diganti di sini akan menghapus modul yang salah tanpa gejala apa pun
     * sampai ada yang membuka Data Absen. Dijaga test khusus.
     */
    public function reset(ResetRecordsRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $deleted = $this->reset->handle(
            $this->scopedStudents($user),
            Activity::class,
            $request->validated(),
        );

        return back()->with('success', "{$deleted} data jurnal berhasil direset.");
    }

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
            'scopeLabel' => $this->scopeLabel($user),
            'can' => ['reset' => $user->hasRole('admin')],
            // Opsi filter modal reset — dua kueri ringan, hanya untuk admin
            // (satu-satunya role yang bisa mereset).
            'classOptions' => $user->hasRole('admin')
                ? Classes::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'industryOptions' => $user->hasRole('admin')
                ? Industry::query()->orderBy('name')->get(['id', 'name'])
                : [],
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
