<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesStudentsByRole;
use App\Http\Requests\AssessmentRequest;
use App\Models\AspekProduktif;
use App\Models\Evaluation;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentController extends Controller
{
    use ScopesStudentsByRole;

    /**
     * Daftar siswa (dibatasi cakupan role) beserta ringkasan nilai.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Siswa langsung diarahkan ke rekap miliknya sendiri.
        if ($user->hasRole('siswa')) {
            $student = $user->students;
            abort_if($student === null, 404);

            return redirect()->route('assessments.show', $student->id);
        }

        $search = trim((string) $request->query('search', ''));

        $students = $this->scopedStudents($user)
            ->with(['classes:id,name', 'industries:id,name'])
            ->withCount('evaluations')
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
                    'scored' => $student->evaluations_count,
                    'avg' => $avg,
                    'grade' => Evaluation::gradeFor($avg),
                ];
            });

        return Inertia::render('assessments/index', [
            'students' => $students,
            'filters' => ['search' => $search],
            'aspectTotal' => AspekProduktif::query()->count(),
        ]);
    }

    /**
     * Rekap nilai satu siswa (aspek teknis & non-teknis + grade).
     */
    public function show(Request $request, Student $student): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->scopedStudents($user)->whereKey($student->id)->exists(), 403);

        $aspects = AspekProduktif::query()
            ->orderBy('no')
            ->orderBy('id')
            ->get(['id', 'category', 'no', 'kemampuan']);

        /** @var Collection<int, int> $scores */
        $scores = $student->evaluations()->pluck('score', 'aspek_produktif_id');

        $rows = fn (string $category): array => $aspects
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

        return Inertia::render('assessments/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
            ],
            'teknis' => $rows(AspekProduktif::CATEGORY_TEKNIS),
            'nonTeknis' => $rows(AspekProduktif::CATEGORY_NON_TEKNIS),
            'can' => [
                'teknis' => $user->hasRole('pembimbing'),
                'nonTeknis' => $user->hasRole('guru'),
            ],
        ]);
    }

    /**
     * Simpan nilai siswa. Guru mengisi aspek non-teknis, pembimbing mengisi teknis
     * (route di-gate `role:guru|pembimbing`).
     */
    public function update(AssessmentRequest $request, Student $student): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->scopedStudents($user)->whereKey($student->id)->exists(), 403);

        $category = $user->hasRole('pembimbing')
            ? AspekProduktif::CATEGORY_TEKNIS
            : AspekProduktif::CATEGORY_NON_TEKNIS;

        $allowedIds = AspekProduktif::query()
            ->where('category', $category)
            ->pluck('id');

        /** @var array<int|string, int|null> $scores */
        $scores = $request->validated()['scores'] ?? [];

        foreach ($scores as $aspekId => $score) {
            if (! $allowedIds->contains((int) $aspekId)) {
                continue; // abaikan aspek di luar kewenangan role
            }

            // Nilai kosong (null setelah ConvertEmptyStringsToNull) menghapus skor.
            if ($score === null) {
                Evaluation::query()
                    ->where('student_id', $student->id)
                    ->where('aspek_produktif_id', (int) $aspekId)
                    ->delete();

                continue;
            }

            Evaluation::query()->updateOrCreate(
                ['student_id' => $student->id, 'aspek_produktif_id' => (int) $aspekId],
                ['score' => (int) $score],
            );
        }

        return back()->with('success', 'Nilai berhasil disimpan.');
    }
}
