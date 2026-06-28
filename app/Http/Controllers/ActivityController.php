<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreActivityRequest;
use App\Http\Requests\UpdateActivityRequest;
use App\Models\Activity;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    /**
     * Jurnal kegiatan milik siswa yang sedang login.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $activities = Activity::query()
            ->where('user_id', $request->user()->id)
            ->when($search !== '', fn ($query) => $query->where('judul', 'like', "%{$search}%"))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Activity $activity): array => [
                'id' => $activity->id,
                'judul' => $activity->judul,
                'date' => $activity->date->format('Y-m-d'),
                'start_time' => mb_substr($activity->start_time, 0, 5),
                'end_time' => mb_substr($activity->end_time, 0, 5),
                'tools' => $activity->tools,
                'verified' => $activity->verified === '1',
            ]);

        return Inertia::render('activities/index', [
            'activities' => $activities,
            'filters' => ['search' => $search],
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

        Activity::create([
            ...$this->journalData($data),
            'user_id' => $request->user()->id,
            'image' => $request->file('image')?->store('activities', 'public'),
        ]);

        return redirect()
            ->route('activities.index')
            ->with('success', 'Jurnal kegiatan berhasil ditambahkan.');
    }

    /**
     * Form edit jurnal.
     */
    public function edit(Activity $activity): Response
    {
        $this->ensureOwner($activity);

        return Inertia::render('activities/edit', [
            'activity' => [
                'id' => $activity->id,
                'judul' => $activity->judul,
                'date' => $activity->date->format('Y-m-d'),
                'start_time' => mb_substr($activity->start_time, 0, 5),
                'end_time' => mb_substr($activity->end_time, 0, 5),
                'description' => $activity->description,
                'tools' => $activity->tools,
                'image' => $activity->image,
            ],
        ]);
    }

    /**
     * Perbarui jurnal milik siswa.
     */
    public function update(UpdateActivityRequest $request, Activity $activity): RedirectResponse
    {
        $this->ensureOwner($activity);

        $data = $request->validated();
        $journal = $this->journalData($data);

        if ($request->hasFile('image')) {
            $this->deleteImage($activity);
            $journal['image'] = $request->file('image')?->store('activities', 'public');
        }

        $activity->update($journal);

        return redirect()
            ->route('activities.index')
            ->with('success', 'Jurnal kegiatan berhasil diperbarui.');
    }

    /**
     * Hapus jurnal milik siswa.
     */
    public function destroy(Activity $activity): RedirectResponse
    {
        $this->ensureOwner($activity);

        $this->deleteImage($activity);
        $activity->delete();

        return redirect()
            ->route('activities.index')
            ->with('success', 'Jurnal kegiatan berhasil dihapus.');
    }

    /**
     * Pastikan jurnal milik siswa yang sedang login.
     */
    private function ensureOwner(Activity $activity): void
    {
        abort_unless($activity->user_id === request()->user()->id, 403);
    }

    /**
     * Kolom jurnal dari data tervalidasi (tanpa akun/gambar).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function journalData(array $data): array
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
}
