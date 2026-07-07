<?php

namespace App\Http\Controllers;

use App\Http\Requests\CertificateTemplateRequest;
use App\Models\CertificateTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * CRUD template sertifikat (admin/kaprog): gambar latar + anchor teks x/y, dan
 * penanda template aktif yang dipakai saat mencetak sertifikat siswa.
 */
class CertificateTemplateController extends Controller
{
    public function index(): Response
    {
        $templates = CertificateTemplate::query()
            ->latest()
            ->get()
            ->map(fn (CertificateTemplate $template): array => [
                'id' => $template->id,
                'name' => $template->name,
                'background' => $template->background,
                'anchorCount' => count($template->anchors),
                'is_active' => $template->is_active,
            ]);

        return Inertia::render('certificate-templates/index', [
            'templates' => $templates,
            'fields' => CertificateTemplate::FIELDS,
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

        $template = CertificateTemplate::create([
            'name' => $data['name'],
            'anchors' => $data['anchors'],
            'background_path' => $request->file('background')->store('certificate-templates', 'public'),
            'is_active' => false,
        ]);

        $this->applySignature($request, $template);

        return redirect()
            ->route('certificate-templates.index')
            ->with('success', 'Template sertifikat berhasil dibuat.');
    }

    public function edit(CertificateTemplate $certificateTemplate): Response
    {
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

    public function destroy(CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $this->deleteBackground($certificateTemplate);
        $this->deleteSignature($certificateTemplate);
        $certificateTemplate->delete();

        return back()->with('success', 'Template sertifikat berhasil dihapus.');
    }

    /**
     * Jadikan template ini satu-satunya yang aktif.
     */
    public function activate(CertificateTemplate $certificateTemplate): RedirectResponse
    {
        DB::transaction(function () use ($certificateTemplate): void {
            CertificateTemplate::query()->update(['is_active' => false]);
            $certificateTemplate->update(['is_active' => true]);
        });

        return back()->with('success', "Template \"{$certificateTemplate->name}\" kini aktif.");
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
