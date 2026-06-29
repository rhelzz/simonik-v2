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
        ]);
    }

    public function store(CertificateTemplateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        CertificateTemplate::create([
            'name' => $data['name'],
            'anchors' => $data['anchors'],
            'background_path' => $request->file('background')->store('certificate-templates', 'public'),
            'is_active' => false,
        ]);

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
            ],
            'fields' => CertificateTemplate::FIELDS,
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

        return redirect()
            ->route('certificate-templates.index')
            ->with('success', 'Template sertifikat berhasil diperbarui.');
    }

    public function destroy(CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $this->deleteBackground($certificateTemplate);
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
}
