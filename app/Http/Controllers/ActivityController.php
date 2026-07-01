<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Models\Activity;
use App\Models\User;
use App\Services\BadgeAwarder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Jurnal kegiatan harian milik siswa sendiri (CRUD). Semua query dibatasi ke
 * akun siswa yang login; aksi pada jurnal milik orang lain dilarang (403).
 */
class ActivityController extends Controller
{
    public function __construct(
        private readonly BadgeAwarder $badgeAwarder
    ) {}

    /**
     * Daftar jurnal milik siswa.
     */
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;

        $activities = Activity::query()
            ->where('user_id', $userId)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn (Activity $activity): array => $this->present($activity));

        return Inertia::render('activities/index', [
            'activities' => $activities,
        ]);
    }

    /**
     * Form tambah jurnal.
     */
    public function create(): Response
    {
        return Inertia::render('activities/create');
    }

    /**
     * Simpan jurnal baru milik siswa.
     */
    public function store(StoreActivityRequest $request): RedirectResponse
    {
        $data = $request->validated();

        /** @var User $user */
        $user = $request->user();

        Activity::create([
            ...$this->fields($data),
            'user_id' => (int) $user->id,
            'image' => $request->file('image')?->store('activities', 'public'),
        ]);

        $this->badgeAwarder->checkAndAward($user);

        return redirect()
            ->route('activities.index')
            ->with('success', 'Jurnal berhasil disimpan.');
    }

    /**
     * Form edit jurnal.
     */
    public function edit(Request $request, Activity $activity): Response
    {
        $this->ensureOwner($request, $activity);

        return Inertia::render('activities/edit', [
            'activity' => $this->present($activity),
        ]);
    }

    /**
     * Perbarui jurnal; foto baru menggantikan foto lama bila diunggah.
     */
    public function update(UpdateActivityRequest $request, Activity $activity): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $this->ensureOwner($request, $activity);

        $fields = $this->fields($request->validated());

        if ($request->hasFile('image')) {
            $this->deleteImage($activity);
            $fields['image'] = $request->file('image')?->store('activities', 'public');
        }

        $activity->update($fields);

        $this->badgeAwarder->checkAndAward($user);

        return redirect()
            ->route('activities.index')
            ->with('success', 'Jurnal berhasil diperbarui.');
    }

    /**
     * Hapus jurnal milik siswa.
     */
    public function destroy(Request $request, Activity $activity): RedirectResponse
    {
        $this->ensureOwner($request, $activity);

        $this->deleteImage($activity);
        $activity->delete();

        return redirect()
            ->route('activities.index')
            ->with('success', 'Jurnal berhasil dihapus.');
    }

    /**
     * Pastikan jurnal memang milik siswa yang login.
     */
    private function ensureOwner(Request $request, Activity $activity): void
    {
        abort_unless($activity->user_id === (int) $request->user()->id, 403);
    }

    /**
     * Kolom jurnal dari data tervalidasi (tanpa user/image).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function fields(array $data): array
    {
        return [
            'judul' => $data['judul'],
            'date' => $data['date'],
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'description' => $data['description'],
            'tools' => $data['tools'],
        ];
    }

    private function deleteImage(Activity $activity): void
    {
        $path = $activity->getRawOriginal('image');

        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * Bentuk data jurnal untuk halaman Inertia.
     *
     * @return array<string, mixed>
     */
    private function present(Activity $activity): array
    {
        return [
            'id' => $activity->id,
            'judul' => $activity->judul,
            'date' => $activity->date->format('Y-m-d'),
            'dateLabel' => $activity->date->translatedFormat('l, d M Y'),
            'start_time' => mb_substr($activity->start_time, 0, 5),
            'end_time' => mb_substr($activity->end_time, 0, 5),
            'description' => $activity->description,
            'tools' => $activity->tools,
            'image' => $activity->image,
            'verified' => $activity->verified === '1',
        ];
    }
}
