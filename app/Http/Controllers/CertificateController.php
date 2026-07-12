<?php

namespace App\Http\Controllers;

use App\Http\Requests\CertificateRequest;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\Student;
use App\Models\User;
use App\Services\QrCodeGenerator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sertifikat per siswa: admin/kaprog dapat menugaskan satu atau lebih
 * sertifikat (memilih template) ke seorang siswa; siswa hanya melihat
 * miliknya sendiri dan hanya dapat mencetak setelah PKL berstatus selesai.
 */
class CertificateController extends Controller
{
    public function __construct(
        private readonly QrCodeGenerator $qr,
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        // Siswa diarahkan langsung ke daftar sertifikat miliknya.
        if ($user->hasRole('siswa')) {
            $student = $user->students;
            abort_if($student === null, 404);

            return redirect()->route('certificates.show', $student->id);
        }

        $search = trim((string) $request->query('search', ''));
        $industryId = $this->ownedIndustryId($user);

        $students = Student::query()
            ->where('archived', false)
            ->withCount('certificates')
            ->with(['classes:id,name', 'industries:id,name'])
            ->when($user->hasRole('pembimbing'), fn (Builder $query) => $query->where('industri_id', $industryId ?? -1))
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
                'certificatesCount' => $student->certificates_count,
            ]);

        return Inertia::render('certificates/index', [
            'students' => $students,
            'filters' => ['search' => $search],
            'hasTemplates' => CertificateTemplate::query()->exists(),
        ]);
    }

    /**
     * Daftar sertifikat milik satu siswa + (untuk admin/kaprog) form penugasan.
     */
    public function show(Request $request, Student $student): Response
    {
        /** @var User $user */
        $user = $request->user();
        $canManage = $this->authorizeView($user, $student);

        $student->loadMissing(['classes:id,name', 'industries:id,name']);
        $this->stampGlobalTemplates($student);
        $student->load(['certificates' => fn ($query) => $query->with('certificateTemplate:id,name')->latest()]);

        return Inertia::render('certificates/show', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
                'eligible' => $student->status_pkl === 'selesai',
            ],
            'certificates' => $student->certificates->map(function (Certificate $certificate): array {
                $templateName = $certificate->certificateTemplate === null ? null : $certificate->certificateTemplate->name;

                return [
                    'id' => $certificate->id,
                    'title' => $certificate->title ?? $templateName ?? 'Sertifikat',
                    'templateName' => $templateName,
                    'createdAt' => $certificate->created_at?->translatedFormat('d F Y'),
                ];
            }),
            'templates' => $canManage
                ? $this->assignableTemplates($user, $student)->get(['id', 'name'])
                : [],
            'canManage' => $canManage,
        ]);
    }

    public function store(CertificateRequest $request, Student $student): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorizeAssign($user, $student, (int) $request->validated('certificate_template_id'));

        $student->certificates()->create($request->validated());

        return back()->with('success', 'Sertifikat berhasil ditambahkan.');
    }

    public function destroy(Request $request, Student $student, Certificate $certificate): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($certificate->student_id === $student->id, 404);
        abort_unless($this->authorizeView($user, $student), 403);

        // Pembimbing hanya boleh mencabut sertifikat dari template industrinya
        // sendiri — tidak boleh mengganggu sertifikat global/individual atau
        // milik industri lain yang kebetulan tertera ke siswa yang sama.
        $industryId = $this->ownedIndustryId($user);

        if ($industryId !== null) {
            $certificate->loadMissing('certificateTemplate');
            $template = $certificate->certificateTemplate;

            abort_unless(
                $template !== null
                    && $template->scope === CertificateTemplate::SCOPE_INDUSTRY
                    && $template->industry_id === $industryId,
                403,
            );
        }

        $certificate->delete();

        return back()->with('success', 'Sertifikat berhasil dihapus.');
    }

    /**
     * Template yang boleh ditugaskan manual untuk siswa ini: sertifikat
     * individual (prestasi) selalu tersedia; sertifikat industri hanya bila
     * milik industri tempat siswa ini magang. Global tidak ditawarkan di
     * sini karena sudah otomatis tertera lewat {@see stampGlobalTemplates()}.
     *
     * @return Builder<CertificateTemplate>
     */
    private function assignableTemplates(User $user, Student $student): Builder
    {
        $industryId = $this->ownedIndustryId($user);

        $query = CertificateTemplate::query()->orderBy('name');

        if ($industryId !== null) {
            // Pembimbing: hanya template industrinya sendiri.
            return $query->where('scope', CertificateTemplate::SCOPE_INDUSTRY)
                ->where('industry_id', $industryId);
        }

        return $query->where(
            fn (Builder $q) => $q->where('scope', CertificateTemplate::SCOPE_INDIVIDUAL)
                ->orWhere(
                    fn (Builder $q2) => $q2->where('scope', CertificateTemplate::SCOPE_INDUSTRY)
                        ->where('industry_id', $student->industri_id),
                ),
        );
    }

    /**
     * Otorisasi menugaskan/mencabut satu sertifikat: role harus boleh
     * mengelola siswa ini, dan template yang dipilih harus termasuk dalam
     * template yang boleh ia tugaskan (lihat {@see assignableTemplates()}).
     */
    private function authorizeAssign(User $user, Student $student, int $templateId): void
    {
        abort_unless($this->authorizeView($user, $student), 403);
        abort_unless($this->assignableTemplates($user, $student)->whereKey($templateId)->exists(), 403);
    }

    /**
     * Terbitkan (stamp) template global yang belum dimiliki siswa ini. Ini
     * menutup celah siswa baru yang dibuat setelah sebuah template dijadikan
     * global — sertifikat tetap terbit begitu halaman sertifikatnya dibuka.
     */
    private function stampGlobalTemplates(Student $student): void
    {
        $owned = $student->certificates()->pluck('certificate_template_id');

        CertificateTemplate::query()
            ->global()
            ->whereNotIn('id', $owned)
            ->get(['id'])
            ->each(fn (CertificateTemplate $template) => $student->certificates()->create([
                'certificate_template_id' => $template->id,
            ]));
    }

    /**
     * Halaman pratinjau/cetak satu sertifikat. Pratinjau selalu tersedia;
     * tombol cetak baru aktif setelah status PKL siswa "selesai".
     */
    public function print(Request $request, Student $student, Certificate $certificate): Response
    {
        /** @var User $user */
        $user = $request->user();
        $this->authorizeView($user, $student);
        abort_unless($certificate->student_id === $student->id, 404);

        $certificate->loadMissing('certificateTemplate');
        $template = $certificate->certificateTemplate;
        $eligible = $student->status_pkl === 'selesai';
        $title = $certificate->title ?? ($template === null ? 'Sertifikat' : $template->name);

        return Inertia::render('certificates/print', [
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'class' => $student->classes?->name,
                'industry' => $student->industries?->name,
                'eligible' => $eligible,
            ],
            'title' => $title,
            'template' => $template === null ? null : [
                'background' => $template->background,
                'anchors' => $this->resolveAnchors($template, $student),
                'signature' => $this->resolveSignature($template),
            ],
            'qr' => $this->qr->verificationQr($student),
        ]);
    }

    /**
     * Id industri milik pembimbing yang login, atau null untuk role lain
     * (tanpa batasan kepemilikan) maupun pembimbing tanpa profil industri.
     */
    private function ownedIndustryId(User $user): ?int
    {
        if (! $user->hasRole('pembimbing')) {
            return null;
        }

        return $user->pembimbing?->industry?->id;
    }

    /**
     * Siswa hanya boleh melihat miliknya sendiri; pembimbing hanya siswa di
     * industrinya sendiri; role lain butuh admin/kaprog/wakasek. Mengembalikan
     * true bila peran boleh mengelola (menambah/menghapus) sertifikat siswa ini.
     */
    private function authorizeView(User $user, Student $student): bool
    {
        if ($user->hasRole('siswa')) {
            abort_unless($student->user_id === (int) $user->id, 403);

            return false;
        }

        if ($user->hasRole('pembimbing')) {
            $industryId = $this->ownedIndustryId($user);
            abort_unless($industryId !== null && $student->industri_id === $industryId, 403);

            return true;
        }

        abort_unless($user->hasAnyRole(['admin', 'kaprog', 'wakasek']), 403);

        return $user->hasAnyRole(['admin', 'kaprog']);
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
                'font' => $anchor['font'] ?? 'Poppins',
            ];
        }

        return $resolved;
    }

    /**
     * TTD digital (url + posisi) bila template memilikinya.
     *
     * @return array{url: string, x: float, y: float, width: float}|null
     */
    private function resolveSignature(CertificateTemplate $template): ?array
    {
        if ($template->signature_path === null || $template->signature === null) {
            return null;
        }

        $pos = $template->signature;

        return [
            'url' => (string) $template->signatureUrl,
            'x' => (float) ($pos['x'] ?? 50),
            'y' => (float) ($pos['y'] ?? 80),
            'width' => (float) ($pos['width'] ?? 20),
        ];
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
