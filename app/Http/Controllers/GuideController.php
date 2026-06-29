<?php

namespace App\Http\Controllers;

use App\Http\Requests\GuideRequest;
use App\Models\Guide;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Panduan PKL: dokumen (PDF/Office) yang diunggah admin/kaprog dan dapat dilihat
 * serta diunduh oleh semua role. Pengelolaan (tambah/ubah/hapus) hanya admin.
 */
class GuideController extends Controller
{
    /**
     * Daftar panduan untuk semua role; admin/kaprog melihat kontrol kelola.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $guides = Guide::query()
            ->latest()
            ->get()
            ->map(fn (Guide $guide): array => $this->present($guide));

        return Inertia::render('guides/index', [
            'guides' => $guides,
            'can' => ['manage' => $user->hasAnyRole(['admin', 'kaprog'])],
        ]);
    }

    /**
     * Unggah panduan baru.
     */
    public function store(GuideRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Guide::create([
            'user_id' => (int) $request->user()->id,
            'judul' => $data['judul'],
            'deskripsi' => $data['deskripsi'] ?? null,
            'dokumen' => $request->file('dokumen')->store('guides', 'public'),
        ]);

        return back()->with('success', 'Panduan berhasil diunggah.');
    }

    /**
     * Perbarui metadata panduan; berkas baru menggantikan yang lama bila diunggah.
     */
    public function update(GuideRequest $request, Guide $guide): RedirectResponse
    {
        $data = $request->validated();

        $fields = [
            'judul' => $data['judul'],
            'deskripsi' => $data['deskripsi'] ?? null,
        ];

        if ($request->hasFile('dokumen')) {
            $this->deleteFile($guide);
            $fields['dokumen'] = $request->file('dokumen')->store('guides', 'public');
        }

        $guide->update($fields);

        return back()->with('success', 'Panduan berhasil diperbarui.');
    }

    /**
     * Hapus panduan beserta berkasnya.
     */
    public function destroy(Guide $guide): RedirectResponse
    {
        $this->deleteFile($guide);
        $guide->delete();

        return back()->with('success', 'Panduan berhasil dihapus.');
    }

    private function deleteFile(Guide $guide): void
    {
        $path = $guide->getRawOriginal('dokumen');

        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Bentuk data panduan untuk halaman Inertia (termasuk tipe & ukuran berkas).
     *
     * @return array<string, mixed>
     */
    private function present(Guide $guide): array
    {
        $path = $guide->getRawOriginal('dokumen');

        return [
            'id' => $guide->id,
            'judul' => $guide->judul,
            'deskripsi' => $guide->deskripsi,
            'dokumen' => $guide->dokumen,
            'type' => mb_strtoupper(pathinfo((string) $path, PATHINFO_EXTENSION)),
            'size' => $this->humanSize($path),
            'uploadedAt' => $guide->created_at?->translatedFormat('d M Y'),
        ];
    }

    private function humanSize(?string $path): ?string
    {
        if ($path === null || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $bytes = Storage::disk('public')->size($path);

        if ($bytes >= 1_048_576) {
            return round($bytes / 1_048_576, 1).' MB';
        }

        return max(1, (int) round($bytes / 1024)).' KB';
    }
}
