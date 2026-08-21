<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAnnouncementRequest;
use App\Http\Requests\UpdateAnnouncementRequest;
use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pengumuman yang tampil di dashboard role sasaran. Dibuat admin & guru
 * pembimbing; guru hanya berwenang atas pengumuman buatannya sendiri.
 */
class AnnouncementController extends Controller
{
    /**
     * Opsi target — PERSIS lima yang diminta, dengan label yang dipakai
     * peminta sendiri ("All User", "Orangtua"), bukan nama role internal
     * ('siswa', 'guru', 'pembimbing', 'orangtua') dan bukan daftar seluruh
     * role di sistem.
     *
     * Konsekuensi: kaprog & wakasek hanya menerima pengumuman ber-target
     * "All User". Menambahkan mereka sebagai target terpisah = dua baris di
     * konstanta ini dan nol perubahan lain.
     *
     * @var array<string, string>
     */
    public const ROLE_LABELS = [
        Announcement::ALL_ROLES => 'All User',
        'siswa' => 'Murid',
        'guru' => 'Guru Pembimbing',
        'pembimbing' => 'Pembimbing Industri',
        'orangtua' => 'Orangtua',
    ];

    /**
     * Daftar pengumuman dalam cakupan pemanggil.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'semua');

        $announcements = $this->scopedAnnouncements($user)
            ->with('author:id,name')
            ->when($search !== '', fn (Builder $query) => $query->where('title', 'like', "%{$search}%"))
            ->latest('starts_at')
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Announcement $announcement): array => $this->present($announcement));

        return Inertia::render('announcements/index', [
            'announcements' => $announcements,
            'filters' => ['search' => $search, 'status' => $status],
            'roleLabels' => self::ROLE_LABELS,
            'scopeLabel' => $user->hasRole('admin')
                ? 'Menampilkan seluruh pengumuman.'
                : 'Menampilkan pengumuman yang Anda buat.',
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('announcements/create', [
            'roleLabels' => self::ROLE_LABELS,
        ]);
    }

    public function store(StoreAnnouncementRequest $request): RedirectResponse
    {
        Announcement::create([
            ...$request->validated(),
            'user_id' => (int) $request->user()->id,
        ]);

        return redirect()
            ->route('announcements.index')
            ->with('success', 'Pengumuman berhasil dibuat.');
    }

    public function edit(Request $request, Announcement $announcement): Response
    {
        $this->authorizeScope($request, $announcement);

        return Inertia::render('announcements/edit', [
            'announcement' => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'body' => $announcement->body,
                'roles' => $announcement->roles,
                'starts_at' => $announcement->starts_at->format('Y-m-d'),
                'ends_at' => $announcement->ends_at->format('Y-m-d'),
            ],
            'roleLabels' => self::ROLE_LABELS,
        ]);
    }

    public function update(UpdateAnnouncementRequest $request, Announcement $announcement): RedirectResponse
    {
        $this->authorizeScope($request, $announcement);

        $announcement->update($request->validated());

        return redirect()
            ->route('announcements.index')
            ->with('success', 'Pengumuman berhasil diperbarui.');
    }

    public function destroy(Request $request, Announcement $announcement): RedirectResponse
    {
        $this->authorizeScope($request, $announcement);

        $announcement->delete();

        return back()->with('success', 'Pengumuman berhasil dihapus.');
    }

    /**
     * Bentuk satu pengumuman untuk tabel. Status & label role dipetakan di
     * backend agar tidak ada kamus kedua di React.
     *
     * @return array<string, mixed>
     */
    private function present(Announcement $announcement): array
    {
        $today = Carbon::today();

        // Status diturunkan dari kedua tanggal — tidak ada kolom is_active
        // yang bisa jadi tidak sinkron dengan periodenya.
        $status = match (true) {
            $announcement->starts_at->greaterThan($today) => 'terjadwal',
            $announcement->ends_at->lessThan($today) => 'berakhir',
            default => 'tayang',
        };

        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'roles' => $announcement->roles,
            'roleLabels' => array_values(array_map(
                fn (string $role): string => self::ROLE_LABELS[$role] ?? $role,
                $announcement->roles,
            )),
            'author' => $announcement->author?->name,
            'startsAt' => $announcement->starts_at->translatedFormat('d M Y'),
            'endsAt' => $announcement->ends_at->translatedFormat('d M Y'),
            'status' => $status,
            'statusLabel' => match ($status) {
                'terjadwal' => 'Terjadwal',
                'berakhir' => 'Berakhir',
                default => 'Tayang',
            },
        ];
    }

    /**
     * Pengumuman dalam cakupan pemanggil: admin melihat semua, guru hanya
     * miliknya sendiri.
     *
     * @return Builder<Announcement>
     */
    private function scopedAnnouncements(User $user): Builder
    {
        return $user->hasRole('admin')
            ? Announcement::query()
            : Announcement::query()->where('user_id', $user->id);
    }

    /**
     * 403 bila pengumuman di luar cakupan — menyembunyikannya dari daftar saja
     * tidak cukup, URL bisa ditebak.
     */
    private function authorizeScope(Request $request, Announcement $announcement): void
    {
        /** @var User $user */
        $user = $request->user();

        abort_unless(
            $this->scopedAnnouncements($user)->whereKey($announcement->id)->exists(),
            403,
        );
    }
}
