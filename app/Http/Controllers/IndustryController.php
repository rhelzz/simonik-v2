<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreIndustryRequest;
use App\Http\Requests\UpdateIndustryRequest;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class IndustryController extends Controller
{
    /**
     * Daftar industri dengan pencarian nama.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $industries = Industry::query()
            ->with(['users:id,email', 'pembimbingNormatif:id,name'])
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
                'email' => $industry->users?->email,
                'pembimbing' => $industry->pembimbingNormatif?->name,
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
     * Simpan industri baru beserta akun mitra-nya.
     */
    public function store(StoreIndustryRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            $user->assignRole('mitra');

            Industry::create([
                ...$this->profileData($data),
                'user_id' => $user->id,
            ]);
        });

        return redirect()
            ->route('industries.index')
            ->with('success', 'Industri berhasil ditambahkan.');
    }

    /**
     * Form edit industri.
     */
    public function edit(Industry $industry): Response
    {
        $industry->load('users:id,email');

        return Inertia::render('industries/edit', [
            'industry' => [
                'id' => $industry->id,
                'name' => $industry->name,
                'email' => $industry->users?->email,
                'bidang' => $industry->bidang,
                'alamat' => $industry->alamat,
                'longitude' => $industry->longitude,
                'latitude' => $industry->latitude,
                'industryMentorName' => $industry->industryMentorName,
                'industryMentorNo' => $industry->industryMentorNo,
                'duration' => $industry->duration,
                'pembimbing_id' => $industry->pembimbing_id,
            ],
            'options' => $this->options(),
        ]);
    }

    /**
     * Perbarui industri & akunnya.
     */
    public function update(UpdateIndustryRequest $request, Industry $industry): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($industry, $data): void {
            $industry->users?->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            $industry->update($this->profileData($data));
        });

        return redirect()
            ->route('industries.index')
            ->with('success', 'Data industri berhasil diperbarui.');
    }

    /**
     * Hapus industri beserta akunnya.
     */
    public function destroy(Industry $industry): RedirectResponse
    {
        // FK students.industri_id cascade — tolak hapus bila masih ada siswa ditempatkan.
        if ($industry->students()->exists()) {
            return back()->with('error', 'Industri tidak bisa dihapus karena masih menjadi tempat PKL siswa.');
        }

        // Menghapus user akan cascade ke record industri (FK onDelete cascade).
        $industry->users?->delete();

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
            'industryMentorName' => $data['industryMentorName'],
            'industryMentorNo' => $data['industryMentorNo'],
            'duration' => $data['duration'] ?? null,
            'pembimbing_id' => $data['pembimbing_id'] ?? null,
        ];
    }

    /**
     * Opsi relasi untuk dropdown form.
     *
     * @return array<string, mixed>
     */
    private function options(): array
    {
        return [
            'pembimbings' => Pembimbing::orderBy('name')->get(['id', 'name']),
        ];
    }
}
