<?php

namespace App\Http\Controllers;

use App\Exports\IndustryExport;
use App\Http\Controllers\Concerns\HandlesImportExport;
use App\Http\Requests\StoreIndustryRequest;
use App\Http\Requests\UpdateIndustryCoordinatesRequest;
use App\Http\Requests\UpdateIndustryRequest;
use App\Imports\IndustryImport;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\Teacher;
use App\Support\ImportTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class IndustryController extends Controller
{
    use HandlesImportExport;

    public function export(): BinaryFileResponse
    {
        return Excel::download(new IndustryExport, 'data-industri.xlsx');
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(ImportTemplates::industry(), 'template-impor-industri.xlsx');
    }

    public function import(Request $request): RedirectResponse
    {
        return $this->runImport($request, new IndustryImport, 'industries.index');
    }

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
     * Detail industri beserta relasi & daftar siswa PKL.
     */
    public function show(Industry $industry): Response
    {
        $industry->load([
            'teachers:id,name',
            'pembimbingNormatif:id,name,no_hp',
        ]);

        $students = $industry->students()
            ->with('classes:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'nis', 'status_pkl', 'class_id']);

        return Inertia::render('industries/show', [
            'industry' => [
                'id' => $industry->id,
                'name' => $industry->name,
                'bidang' => $industry->bidang,
                'alamat' => $industry->alamat,
                'longitude' => $industry->longitude,
                'latitude' => $industry->latitude,
                'radius' => $industry->radius,
                'jam_masuk' => $industry->jam_masuk ? substr($industry->jam_masuk, 0, 5) : null,
                'jam_pulang' => $industry->jam_pulang ? substr($industry->jam_pulang, 0, 5) : null,
                'duration' => $industry->duration,
                'guru' => $industry->teachers?->name,
                'pembimbing' => $industry->pembimbingNormatif?->name,
                'pembimbing_no_hp' => $industry->pembimbingNormatif?->no_hp,
            ],
            'students' => $students->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'nis' => $s->nis,
                'status_pkl' => $s->status_pkl,
                'class' => $s->classes?->name,
            ]),
        ]);
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
                'radius' => $industry->radius,
                'jam_masuk' => $industry->jam_masuk ? substr($industry->jam_masuk, 0, 5) : null,
                'jam_pulang' => $industry->jam_pulang ? substr($industry->jam_pulang, 0, 5) : null,
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
            'radius' => $data['radius'] ?? 100,
            'jam_masuk' => $data['jam_masuk'] ?? null,
            'jam_pulang' => $data['jam_pulang'] ?? null,
            'duration' => $data['duration'] ?? null,
            'pembimbing_id' => $data['pembimbing_id'] ?? null,
            'teacher_id' => $data['teacher_id'] ?? null,
        ];
    }

    /**
     * Perbarui koordinat & radius industri saja (multi-peran: admin, kaprog, guru, pembimbing).
     */
    public function updateCoordinates(UpdateIndustryCoordinatesRequest $request, Industry $industry): RedirectResponse
    {
        Gate::authorize('updateCoordinates', $industry);

        $industry->update($request->validated());

        return back()->with('success', 'Koordinat dan radius industri berhasil diperbarui.');
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
