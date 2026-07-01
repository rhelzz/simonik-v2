<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Models\Activity;
use App\Models\AspekProduktif;
use App\Models\Attendance;
use App\Models\Evaluation;
use App\Models\SidangResult;
use App\Models\SidangScore;
use App\Models\Student;
use App\Models\User;
use App\Services\QrCodeGenerator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Rapor Digital: kompilasi nilai teknis/non-teknis + sidang + rekap absen/jurnal
 * menjadi dokumen siap cetak (print-to-PDF) ber-QR keaslian. Admin/kaprog/wakasek
 * dapat melihat semua siswa dalam cakupannya; siswa hanya rapornya sendiri.
 */
class RaporController extends Controller
{
    use ScopesStudentsByRole;

    public function __construct(
        private readonly QrCodeGenerator $qr,
    ) {}

    /**
     * Daftar siswa (dibatasi cakupan role) untuk memilih rapor yang dicetak.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasRole('siswa')) {
            $student = $user->students;
            abort_if($student === null, 404);

            return redirect()->route('rapor.show', $student->id);
        }

        $search = trim((string) $request->query('search', ''));

        $students = $this->scopedStudents($user)
            ->where('archived', false)
            ->with(['classes:id,name', 'industries:id,name'])
            ->withAvg('evaluations as avg_score', 'score')
            ->when($search !== '', fn (Builder $query) => $query->where(
                fn (Builder $q) => $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nis', 'like', "%{$search}%"),
            ))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(function (Student $student): array {
                $rawAvg = $student->getAttribute('avg_score');
                $avg = $rawAvg === null ? null : (int) round((float) $rawAvg);

                return [
                    'id' => $student->id,
                    'name' => $student->name,
                    'nis' => $student->nis,
                    'class' => $student->classes?->name,
                    'industry' => $student->industries?->name,
                    'avg' => $avg,
                    'grade' => Evaluation::gradeFor($avg),
                    'eligible' => $student->status_pkl === 'selesai',
                ];
            });

        return Inertia::render('rapor/index', [
            'students' => $students,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Rapor lengkap satu siswa siap cetak.
     */
    public function show(Request $request, Student $student): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasRole('siswa')) {
            abort_unless($student->user_id === (int) $user->id, 403);
        } else {
            abort_unless($this->scopedStudents($user)->whereKey($student->id)->exists(), 403);
        }

        $student->loadMissing([
            'classes:id,name',
            'industries:id,name',
            'departements:id,name',
            'pkl_period:id,name_period',
        ]);

        $aspects = AspekProduktif::query()
            ->orderBy('no')
            ->orderBy('id')
            ->get(['id', 'category', 'no', 'kemampuan']);

        /** @var Collection<int, int> $scores */
        $scores = $student->evaluations()->pluck('score', 'aspek_produktif_id');

        $teknis = $this->aspectRows($aspects, $scores, AspekProduktif::CATEGORY_TEKNIS);
        $nonTeknis = $this->aspectRows($aspects, $scores, AspekProduktif::CATEGORY_NON_TEKNIS);

        $sidang = $this->sidang($student);

        $avgTeknis = $this->average(array_column($teknis, 'score'));
        $avgNonTeknis = $this->average(array_column($nonTeknis, 'score'));
        $avgSidang = $sidang['average'];

        $components = array_values(array_filter(
            [$avgTeknis, $avgNonTeknis, $avgSidang],
            fn (?int $value): bool => $value !== null,
        ));
        $final = $components === [] ? null : (int) round(array_sum($components) / \count($components));

        return Inertia::render('rapor/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'department' => $student->departements?->name,
                'industry' => $student->industries?->name,
                'period' => $student->pkl_period?->name_period,
                'startLabel' => $student->pkl_start?->translatedFormat('d F Y'),
                'endLabel' => $student->pkl_end?->translatedFormat('d F Y'),
                'eligible' => $student->status_pkl === 'selesai',
            ],
            'teknis' => $teknis,
            'nonTeknis' => $nonTeknis,
            'sidang' => $sidang,
            'attendance' => $this->attendanceRecap((int) $student->user_id),
            'journalTotal' => Activity::query()->where('user_id', $student->user_id)->count(),
            'summary' => [
                'teknis' => $avgTeknis,
                'nonTeknis' => $avgNonTeknis,
                'sidang' => $avgSidang,
                'final' => $final,
                'grade' => Evaluation::gradeFor($final),
                'qualification' => Evaluation::qualificationFor($final),
            ],
            'qr' => $this->qr->verificationQr($student),
            'printedAt' => Carbon::now()->translatedFormat('d F Y'),
        ]);
    }

    /**
     * Baris nilai satu kategori aspek (teknis/non-teknis).
     *
     * @param  Collection<int, AspekProduktif>  $aspects
     * @param  Collection<int, int>  $scores
     * @return array<int, array<string, mixed>>
     */
    private function aspectRows(Collection $aspects, Collection $scores, string $category): array
    {
        return $aspects
            ->where('category', $category)
            ->values()
            ->map(function (AspekProduktif $aspek) use ($scores): array {
                $raw = $scores->get($aspek->id);
                $score = $raw === null ? null : (int) $raw;

                return [
                    'id' => $aspek->id,
                    'no' => $aspek->no,
                    'kemampuan' => $aspek->kemampuan,
                    'score' => $score,
                    'grade' => Evaluation::gradeFor($score),
                    'qualification' => Evaluation::qualificationFor($score),
                ];
            })
            ->all();
    }

    /**
     * Nilai sidang siswa: daftar aspek + nilai, penguji, status, dan rata-rata.
     *
     * @return array{scores: array<int, array<string, mixed>>, penguji1: string|null, penguji2: string|null, deskripsi: string|null, status: string|null, average: int|null}
     */
    private function sidang(Student $student): array
    {
        $rows = SidangScore::query()
            ->where('student_id', $student->id)
            ->with('aspect:id,nama_aspek')
            ->get()
            ->map(fn (SidangScore $row): array => [
                'aspek' => $row->aspect->nama_aspek,
                'nilai' => $row->nilai,
                'grade' => Evaluation::gradeFor($row->nilai),
            ])
            ->all();

        $result = SidangResult::query()->where('student_id', $student->id)->first();

        return [
            'scores' => $rows,
            'penguji1' => $result?->penguji_1,
            'penguji2' => $result?->penguji_2,
            'deskripsi' => $result?->deskripsi,
            'status' => $result?->status,
            'average' => $this->average(array_column($rows, 'nilai')),
        ];
    }

    /**
     * Rekap kehadiran per status untuk seorang siswa (via user_id).
     *
     * @return array{hadir: int, izin: int, sakit: int, alpha: int, libur: int, total: int}
     */
    private function attendanceRecap(int $userId): array
    {
        /** @var Collection<string, int> $counts */
        $counts = Attendance::query()
            ->where('user_id', $userId)
            ->selectRaw('LOWER(status) as s, count(*) as c')
            ->groupBy('s')
            ->pluck('c', 's');

        $hadir = (int) $counts->get('hadir', 0) + (int) $counts->get('masuk', 0);
        $izin = (int) $counts->get('izin', 0);
        $sakit = (int) $counts->get('sakit', 0);
        $alpha = (int) $counts->get('alpha', 0);
        $libur = (int) $counts->get('libur', 0);

        return [
            'hadir' => $hadir,
            'izin' => $izin,
            'sakit' => $sakit,
            'alpha' => $alpha,
            'libur' => $libur,
            'total' => $hadir + $izin + $sakit + $alpha + $libur,
        ];
    }

    /**
     * Rata-rata (dibulatkan) dari nilai non-null; null bila tak ada nilai.
     *
     * @param  array<int, int|null>  $values
     */
    private function average(array $values): ?int
    {
        $present = array_values(array_filter($values, fn (?int $value): bool => $value !== null));

        if ($present === []) {
            return null;
        }

        return (int) round(array_sum($present) / \count($present));
    }
}
