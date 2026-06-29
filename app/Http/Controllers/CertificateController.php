<?php

namespace App\Http\Controllers;

use App\Models\CertificateTemplate;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Output sertifikat per siswa memakai template aktif. Admin/kaprog dapat
 * mencetak sertifikat siswa mana pun; siswa hanya miliknya sendiri.
 */
class CertificateController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Siswa diarahkan langsung ke sertifikat miliknya.
        if ($user->hasRole('siswa')) {
            $student = $user->students;
            abort_if($student === null, 404);

            return redirect()->route('certificates.show', $student->id);
        }

        $search = trim((string) $request->query('search', ''));

        $students = Student::query()
            ->where('archived', false)
            ->with(['classes:id,name', 'industries:id,name'])
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
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
                'eligible' => $student->status_pkl === 'selesai',
            ]);

        return Inertia::render('certificates/index', [
            'students' => $students,
            'filters' => ['search' => $search],
            'hasActiveTemplate' => CertificateTemplate::query()->active()->exists(),
        ]);
    }

    /**
     * Halaman cetak sertifikat satu siswa (latar template + teks ter-anchor).
     */
    public function show(Request $request, Student $student): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->hasRole('siswa')) {
            abort_unless($student->user_id === (int) $user->id, 403);
        } else {
            abort_unless($user->hasAnyRole(['admin', 'kaprog']), 403);
        }

        $student->loadMissing(['classes:id,name', 'industries:id,name']);
        $template = CertificateTemplate::query()->active()->first();

        return Inertia::render('certificates/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
                'eligible' => $student->status_pkl === 'selesai',
            ],
            'template' => $template === null ? null : [
                'background' => $template->background,
                'anchors' => $this->resolveAnchors($template, $student),
            ],
        ]);
    }

    /**
     * Petakan tiap anchor aktif ke teks nyata dari data siswa.
     *
     * @return array<int, array<string, mixed>>
     */
    private function resolveAnchors(CertificateTemplate $template, Student $student): array
    {
        $values = $this->values($student);

        $resolved = [];

        foreach ($template->anchors as $anchor) {
            if (! ($anchor['enabled'] ?? false)) {
                continue;
            }

            $resolved[] = [
                'text' => $values[$anchor['field']] ?? '',
                'x' => $anchor['x'],
                'y' => $anchor['y'],
                'size' => $anchor['size'],
                'align' => $anchor['align'],
                'color' => $anchor['color'],
            ];
        }

        return $resolved;
    }

    /**
     * Nilai teks per field dari data siswa.
     *
     * @return array<string, string>
     */
    private function values(Student $student): array
    {
        // pkl_end nullable; baca nilai mentah agar penanganan null eksplisit.
        $rawEnd = $student->getRawOriginal('pkl_end');
        $end = $rawEnd !== null ? Carbon::parse($rawEnd) : Carbon::now();

        return [
            'nama' => $student->name,
            'nis' => $student->nis,
            'nomor' => sprintf('PKL/%d/%04d', $end->year, $student->id),
            'industri' => $student->industries->name,
            'tanggal' => $end->translatedFormat('d F Y'),
        ];
    }
}
