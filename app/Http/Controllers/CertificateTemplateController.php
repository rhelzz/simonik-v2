<?php

namespace App\Http\Controllers;

use App\Http\Requests\CertificateTemplateRequest;
use App\Models\CertificateTemplate;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CRUD template sertifikat. Admin/kaprog mengelola template global &
 * individual (prestasi); pembimbing (perwakilan industri) hanya dapat
 * mengelola template miliknya sendiri (scope "industry"), dan hanya melihat
 * template itu saja — tidak bisa menyentuh template global/individual milik
 * pihak lain.
 */
class CertificateTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        $industryId = $this->ownedIndustryId($request->user());

        $templates = CertificateTemplate::query()
            ->when($industryId !== null, fn ($query) => $query->where('industry_id', $industryId))
            ->latest()
            ->get()
            ->map(fn (CertificateTemplate $template): array => [
                'id' => $template->id,
                'name' => $template->name,
                'background' => $template->background,
                'anchorCount' => count($template->anchors),
                'scope' => $template->scope,
            ]);

        return Inertia::render('certificate-templates/index', [
            'templates' => $templates,
            'fields' => CertificateTemplate::FIELDS,
            'canToggleGlobal' => $industryId === null,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('certificate-templates/create', [
            'fields' => CertificateTemplate::FIELDS,
            'fonts' => CertificateTemplate::FONTS,
        ]);
    }

    public function store(CertificateTemplateRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $industryId = $this->ownedIndustryId($request->user());
        abort_if($request->user()->hasRole('pembimbing') && $industryId === null, 403);

        $template = CertificateTemplate::create([
            'name' => $data['name'],
            'anchors' => $data['anchors'],
            'background_path' => $request->file('background')->store('certificate-templates', 'public'),
            'scope' => $industryId !== null ? CertificateTemplate::SCOPE_INDUSTRY : CertificateTemplate::SCOPE_INDIVIDUAL,
            'industry_id' => $industryId,
        ]);

        $this->applySignature($request, $template);

        return redirect()
            ->route('certificate-templates.index')
            ->with('success', 'Template sertifikat berhasil dibuat.');
    }

    public function edit(Request $request, CertificateTemplate $certificateTemplate): Response
    {
        $this->authorizeManage($request->user(), $certificateTemplate);

        return Inertia::render('certificate-templates/edit', [
            'template' => [
                'id' => $certificateTemplate->id,
                'name' => $certificateTemplate->name,
                'background' => $certificateTemplate->background,
                'anchors' => $certificateTemplate->anchors,
                'signatureUrl' => $certificateTemplate->signatureUrl,
                'signaturePos' => $certificateTemplate->signature,
            ],
            'fields' => CertificateTemplate::FIELDS,
            'fonts' => CertificateTemplate::FONTS,
        ]);
    }

    public function update(CertificateTemplateRequest $request, CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $this->authorizeManage($request->user(), $certificateTemplate);

        $data = $request->validated();

        $fields = [
            'name' => $data['name'],
            'anchors' => $data['anchors'],
        ];

        if ($request->hasFile('background')) {
            $this->deleteBackground($certificateTemplate);
            $fields['background_path'] = $request->file('background')->store('certificate-templates', 'public');
        }

        $certificateTemplate->update($fields);

        $this->applySignature($request, $certificateTemplate);

        return redirect()
            ->route('certificate-templates.index')
            ->with('success', 'Template sertifikat berhasil diperbarui.');
    }

    public function destroy(Request $request, CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $this->authorizeManage($request->user(), $certificateTemplate);

        $this->deleteBackground($certificateTemplate);
        $this->deleteSignature($certificateTemplate);
        $certificateTemplate->delete();

        return back()->with('success', 'Template sertifikat berhasil dihapus.');
    }

    /**
     * Nyalakan/matikan status global template ini (admin/kaprog saja — tidak
     * berlaku untuk template milik industri). Saat dinyalakan, sertifikat
     * langsung diterbitkan (distamp) ke semua siswa yang belum memilikinya;
     * mematikan hanya menghentikan penerbitan otomatis ke depan — sertifikat
     * yang sudah terbit tetap ada sampai dihapus manual.
     */
    public function toggleGlobal(CertificateTemplate $certificateTemplate): RedirectResponse
    {
        abort_if($certificateTemplate->scope === CertificateTemplate::SCOPE_INDUSTRY, 403);

        $certificateTemplate->update([
            'scope' => $certificateTemplate->scope === CertificateTemplate::SCOPE_GLOBAL
                ? CertificateTemplate::SCOPE_INDIVIDUAL
                : CertificateTemplate::SCOPE_GLOBAL,
        ]);

        if ($certificateTemplate->scope === CertificateTemplate::SCOPE_GLOBAL) {
            $this->stampAllStudents($certificateTemplate);

            return back()->with('success', "Template \"{$certificateTemplate->name}\" kini global dan tertera ke semua siswa.");
        }

        return back()->with('success', "Template \"{$certificateTemplate->name}\" tidak lagi global.");
    }

    /**
     * Terbitkan sertifikat dari template ini ke setiap siswa yang belum
     * memilikinya.
     */
    private function stampAllStudents(CertificateTemplate $template): void
    {
        $alreadyStamped = $template->certificates()->pluck('student_id');

        Student::query()
            ->whereNotIn('id', $alreadyStamped)
            ->each(fn (Student $student) => $student->certificates()->create([
                'certificate_template_id' => $template->id,
            ]));
    }

    /**
     * Id industri milik pembimbing yang login, atau null untuk admin/kaprog
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
     * Admin/kaprog bebas mengelola semua template. Pembimbing hanya boleh
     * mengelola template industri miliknya sendiri — tidak boleh mengganggu
     * template global/individual atau milik industri lain.
     */
    private function authorizeManage(User $user, CertificateTemplate $template): void
    {
        if (! $user->hasRole('pembimbing')) {
            return;
        }

        $industryId = $this->ownedIndustryId($user);

        abort_unless(
            $industryId !== null
                && $template->scope === CertificateTemplate::SCOPE_INDUSTRY
                && $template->industry_id === $industryId,
            403,
        );
    }

    private function deleteBackground(CertificateTemplate $template): void
    {
        if ($template->background_path) {
            Storage::disk('public')->delete($template->background_path);
        }
    }

    /**
     * Simpan/hapus TTD digital + posisinya sesuai input request. Berkas TTD
     * lama dihapus saat diganti atau saat penghapusan diminta.
     */
    private function applySignature(CertificateTemplateRequest $request, CertificateTemplate $template): void
    {
        $data = $request->validated();

        // Penghapusan eksplisit: buang berkas + posisi.
        if (($data['removeSignature'] ?? false) && ! $request->hasFile('signature')) {
            $this->deleteSignature($template);
            $template->update(['signature_path' => null, 'signature' => null]);

            return;
        }

        $fields = [];

        if ($request->hasFile('signature')) {
            $this->deleteSignature($template);
            $fields['signature_path'] = $request->file('signature')->store('certificate-signatures', 'public');
        }

        // Posisi hanya bermakna bila ada berkas TTD (baru atau tersimpan).
        if (isset($data['signaturePos']) && ($fields['signature_path'] ?? $template->signature_path)) {
            $pos = $data['signaturePos'];
            $fields['signature'] = [
                'x' => (float) $pos['x'],
                'y' => (float) $pos['y'],
                'width' => (float) $pos['width'],
            ];
        }

        if ($fields !== []) {
            $template->update($fields);
        }
    }

    private function deleteSignature(CertificateTemplate $template): void
    {
        if ($template->signature_path) {
            Storage::disk('public')->delete($template->signature_path);
        }
    }
}
