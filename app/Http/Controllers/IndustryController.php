<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIndustryRequest;
use App\Http\Requests\UpdateIndustryRequest;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class IndustryController extends Controller
{
    /**
     * Daftar industri (PT) + relasi guru pembimbing, pembimbing industri, jumlah siswa.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $industries = Industry::query()
            ->with([
                'pembimbingNormatif:id,name',
                'teachers:id,name',
            ])
            ->withCount('students')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Industry $industry): array => [
                'id' => $industry->id,
                'name' => $industry->name,
                'bidang' => $industry->bidang,
                'alamat' => $industry->alamat,
                'pembimbing' => $industry->pembimbingNormatif?->name,
                'guru' => $industry->teachers?->name,
                'students_count' => $industry->students_count,
            ]);

        return Inertia::render('industries/index', [
            'industries' => $industries,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Form tambah industri.
     */
    public function create(): Response
    {
        return Inertia::render('industries/create', [
            'options' => $this->options(),
        ]);
    }

    /**
     * Simpan industri baru. Industri hanya container relasi (tanpa akun).
     */
    public function store(StoreIndustryRequest $request): RedirectResponse
    {
        Industry::create($this->profileData($request->validated()));

        return redirect()
            ->route('industries.index')
            ->with('success', 'Industri berhasil ditambahkan.');
    }

    /**
     * Form edit industri.
     */
    public function edit(Industry $industry): Response
    {
        return Inertia::render('industries/edit', [
            'industry' => [
                'id' => $industry->id,
                'name' => $industry->name,
                'bidang' => $industry->bidang,
                'alamat' => $industry->alamat,
                'longitude' => $industry->longitude,
                'latitude' => $industry->latitude,
                'duration' => $industry->duration,
                'pembimbing_id' => $industry->pembimbing_id,
                'teacher_id' => $industry->teacher_id,
            ],
            'options' => $this->options(),
        ]);
    }

    /**
     * Perbarui profil industri.
     */
    public function update(UpdateIndustryRequest $request, Industry $industry): RedirectResponse
    {
        $industry->update($this->profileData($request->validated()));

        return redirect()
            ->route('industries.index')
            ->with('success', 'Data industri berhasil diperbarui.');
    }

    /**
     * Hapus industri (container relasi, tanpa akun).
     */
    public function destroy(Industry $industry): RedirectResponse
    {
        // FK students.industri_id cascade — tolak hapus bila masih ada siswa ditempatkan.
        if ($industry->students()->exists()) {
            return back()->with('error', 'Industri tidak bisa dihapus karena masih menjadi tempat PKL siswa.');
        }

        $industry->delete();

        return redirect()
            ->route('industries.index')
            ->with('success', 'Industri berhasil dihapus.');
    }

    /**
     * Kolom profil industri dari data tervalidasi (tanpa akun/relasi user).
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function profileData(array $data): array
    {
        return [
            'name' => $data['name'],
            'bidang' => $data['bidang'],
            'alamat' => $data['alamat'],
            'longitude' => $data['longitude'],
            'latitude' => $data['latitude'],
            'duration' => $data['duration'] ?? null,
            'pembimbing_id' => $data['pembimbing_id'] ?? null,
            'teacher_id' => $data['teacher_id'] ?? null,
        ];
    }

    /**
     * Opsi relasi untuk dropdown form (guru pembimbing & pembimbing industri).
     *
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'teachers' => Teacher::orderBy('name')->get(['id', 'name']),
            'pembimbings' => Pembimbing::orderBy('name')->get(['id', 'name']),
        ];
    }
}
