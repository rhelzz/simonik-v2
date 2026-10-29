<?php

namespace App\Http\Controllers;

use App\Http\Requests\GuideRequest;
use App\Models\Guide;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Panduan PKL: artikel panduan beserta gambar, urutan, kategori, dan
 * berkas dokumen pendukung (PDF/Office) yang dikelola admin/kaprog dan
 * dapat dibaca oleh seluruh peran dalam format kartu akordeon.
 */
class GuideController extends Controller
{
    /**
     * Daftar panduan untuk semua role; admin/kaprog melihat kontrol kelola & draf.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $canManage = $user->hasAnyRole(['admin', 'kaprog']);

        $query = Guide::query();

        if (! $canManage) {
            $query->where('status', Guide::STATUS_PUBLISHED);
        }

        $guides = $query
            ->orderBy('urutan', 'asc')
            ->latest('published_at')
            ->latest('created_at')
            ->get()
            ->map(fn (Guide $guide): array => $this->present($guide));

        $categories = Guide::query()
            ->when(! $canManage, fn ($q) => $q->where('status', Guide::STATUS_PUBLISHED))
            ->whereNotNull('kategori')
            ->where('kategori', '!=', '')
            ->distinct()
            ->pluck('kategori')
            ->values();

        return Inertia::render('guides/index', [
            'guides' => $guides,
            'categories' => $categories,
            'can' => ['manage' => $canManage],
        ]);
    }

    /**
     * Simpan panduan baru.
     */
    public function store(GuideRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $status = $data['status'] ?? Guide::STATUS_PUBLISHED;

        $publishedAt = null;
        if (! empty($data['published_at'])) {
            $publishedAt = Carbon::parse($data['published_at']);
        } elseif ($status === Guide::STATUS_PUBLISHED) {
            $publishedAt = now();
        }

        $guideData = [
            'user_id' => (int) $request->user()->id,
            'judul' => $data['judul'],
            'kategori' => $data['kategori'] ?? null,
            'deskripsi' => $data['deskripsi'] ?? null,
            'konten' => $data['konten'] ?? null,
            'status' => $status,
            'urutan' => (int) ($data['urutan'] ?? 0),
            'published_at' => $publishedAt,
            'gambar' => null,
            'dokumen' => null,
        ];

        if ($request->hasFile('gambar')) {
            $guideData['gambar'] = $request->file('gambar')->store('guides/images', 'public');
        }

        if ($request->hasFile('dokumen')) {
            $guideData['dokumen'] = $request->file('dokumen')->store('guides', 'public');
        }

        Guide::create($guideData);

        return back()->with('success', 'Panduan berhasil ditambahkan.');
    }

    /**
     * Perbarui panduan yang ada.
     */
    public function update(GuideRequest $request, Guide $guide): RedirectResponse
    {
        $data = $request->validated();
        $status = $data['status'] ?? $guide->status ?? Guide::STATUS_PUBLISHED;

        $publishedAt = $guide->published_at;
        if (array_key_exists('published_at', $data)) {
            $publishedAt = ! empty($data['published_at']) ? Carbon::parse($data['published_at']) : null;
        } elseif ($status === Guide::STATUS_PUBLISHED && ! $publishedAt) {
            $publishedAt = now();
        }

        $fields = [
            'judul' => $data['judul'],
            'kategori' => $data['kategori'] ?? null,
            'deskripsi' => $data['deskripsi'] ?? null,
            'konten' => $data['konten'] ?? null,
            'status' => $status,
            'urutan' => (int) ($data['urutan'] ?? 0),
            'published_at' => $publishedAt,
        ];

        if ($request->boolean('hapus_gambar')) {
            $this->deleteFile($guide->getRawOriginal('gambar'));
            $fields['gambar'] = null;
        }

        if ($request->hasFile('gambar')) {
            $this->deleteFile($guide->getRawOriginal('gambar'));
            $fields['gambar'] = $request->file('gambar')->store('guides/images', 'public');
        }

        if ($request->boolean('hapus_dokumen')) {
            $this->deleteFile($guide->getRawOriginal('dokumen'));
            $fields['dokumen'] = null;
        }

        if ($request->hasFile('dokumen')) {
            $this->deleteFile($guide->getRawOriginal('dokumen'));
            $fields['dokumen'] = $request->file('dokumen')->store('guides', 'public');
        }

        $guide->update($fields);

        return back()->with('success', 'Panduan berhasil diperbarui.');
    }

    /**
     * Hapus panduan beserta berkas terkait.
     */
    public function destroy(Guide $guide): RedirectResponse
    {
        $this->deleteFile($guide->getRawOriginal('gambar'));
        $this->deleteFile($guide->getRawOriginal('dokumen'));
        $guide->delete();

        return back()->with('success', 'Panduan berhasil dihapus.');
    }

    private function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Bentuk data panduan untuk halaman Inertia.
     *
     * @return array<string, mixed>
     */
    private function present(Guide $guide): array
    {
        $dokumenPath = $guide->getRawOriginal('dokumen');
        $effectiveDate = $guide->published_at ?? $guide->created_at;

        return [
            'id' => $guide->id,
            'judul' => $guide->judul,
            'kategori' => $guide->kategori,
            'deskripsi' => $guide->deskripsi,
            'konten' => $guide->konten,
            'gambar' => $guide->gambar,
            'dokumen' => $guide->dokumen,
            'status' => $guide->status ?? Guide::STATUS_PUBLISHED,
            'urutan' => (int) ($guide->urutan ?? 0),
            'published_at' => $guide->published_at?->format('Y-m-d'),
            'publishedAtFormatted' => $effectiveDate?->translatedFormat('d M Y'),
            'type' => $dokumenPath ? mb_strtoupper(pathinfo((string) $dokumenPath, PATHINFO_EXTENSION)) : null,
            'size' => $this->humanSize($dokumenPath),
            'uploadedAt' => $effectiveDate?->translatedFormat('d M Y'),
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
