<?php

namespace App\Http\Controllers;

use App\Exports\PembimbingExport;
use App\Http\Controllers\Concerns\HandlesImportExport;
use App\Http\Controllers\Concerns\ResolvesRoleAccount;
use App\Http\Requests\StorePembimbingRequest;
use App\Http\Requests\UpdatePembimbingRequest;
use App\Imports\PembimbingImport;
use App\Models\Industry;
use App\Models\Pembimbing;
use App\Support\ImportTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PembimbingController extends Controller
{
    use HandlesImportExport;
    use ResolvesRoleAccount;

    public function export(): BinaryFileResponse
    {
        return Excel::download(new PembimbingExport, 'data-pembimbing.xlsx');
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(ImportTemplates::pembimbing(), 'template-impor-pembimbing.xlsx');
    }

    public function import(Request $request): RedirectResponse
    {
        return $this->runImport($request, new PembimbingImport, 'pembimbings.index');
    }

    /**
     * Daftar pembimbing dengan pencarian nama.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        // Nilai gender bisa bervariasi antar-sumber data (L/P vs male/female);
        // padankan keduanya saat memfilter. Daftar ini sekaligus jadi whitelist:
        // nilai di luar kunci berarti tidak ada filter gender.
        $genderAliases = [
            'L' => ['L', 'l', 'male', 'm'],
            'P' => ['P', 'p', 'female', 'f'],
        ];

        $gender = (string) $request->query('gender', '');
        $aliases = $genderAliases[$gender] ?? null;

        // Pembimbing industri terikat ke satu PT (industries.pembimbing_id);
        // siswa diturunkan lewat PT itu (hasManyThrough).
        $pembimbings = Pembimbing::query()
            ->with(['user:id,email', 'industry:id,name,pembimbing_id'])
            ->withCount('students')
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('no_hp', 'like', "%{$search}%");
                });
            })
            ->when($aliases !== null, fn ($query) => $query->whereIn('gender', $aliases))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Pembimbing $pembimbing): array => [
                'id' => $pembimbing->id,
                'name' => $pembimbing->name,
                'no_hp' => $pembimbing->no_hp,
                'gender' => match (strtolower($pembimbing->gender ?? '')) {
                    'male', 'm', 'l' => 'Laki-laki',
                    'female', 'f', 'p' => 'Perempuan',
                    default => null,
                },
                'email' => $pembimbing->user?->email,
                'industry' => $pembimbing->industry?->name,
                'students_count' => $pembimbing->students_count,
            ]);

        return Inertia::render('pembimbings/index', [
            'pembimbings' => $pembimbings,
            'filters' => [
                'search' => $search,
                'gender' => $aliases !== null ? $gender : null,
            ],
        ]);
    }

    /**
     * Form tambah pembimbing.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('pembimbings/create', [
            'candidates' => $this->accountCandidates($request, 'pembimbing'),
            'industries' => $this->industryOptions(),
        ]);
    }

    /**
     * Simpan pembimbing baru beserta akun loginnya.
     */
    public function store(StorePembimbingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $user = $this->accountFor($data, 'pembimbing');

            $pembimbing = Pembimbing::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'no_hp' => $data['no_hp'],
                'gender' => $data['gender'] ?? null,
            ]);

            $this->syncIndustry($pembimbing, $data['industry_id'] ?? null);
        });

        return redirect()
            ->route('pembimbings.index')
            ->with('success', 'Pembimbing berhasil ditambahkan.');
    }

    /**
     * Form edit pembimbing.
     */
    public function edit(Pembimbing $pembimbing): Response
    {
        $pembimbing->load(['user:id,email', 'industry:id,name,pembimbing_id']);

        return Inertia::render('pembimbings/edit', [
            'pembimbing' => [
                'id' => $pembimbing->id,
                'name' => $pembimbing->name,
                'email' => $pembimbing->user?->email,
                'no_hp' => $pembimbing->no_hp,
                'gender' => $pembimbing->gender,
                'industry_id' => $pembimbing->industry?->id,
            ],
            'industries' => $this->industryOptions($pembimbing->id),
        ]);
    }

    /**
     * Perbarui pembimbing & akunnya.
     */
    public function update(UpdatePembimbingRequest $request, Pembimbing $pembimbing): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($pembimbing, $data): void {
            $pembimbing->user?->update([
                'name' => $data['name'],
                'email' => $data['email'],
                ...empty($data['password']) ? [] : ['password' => Hash::make($data['password'])],
            ]);

            $pembimbing->update([
                'name' => $data['name'],
                'no_hp' => $data['no_hp'],
                'gender' => $data['gender'] ?? null,
            ]);

            $this->syncIndustry($pembimbing, $data['industry_id'] ?? null);
        });

        return redirect()
            ->route('pembimbings.index')
            ->with('success', 'Data pembimbing berhasil diperbarui.');
    }

    /**
     * Detail pembimbing lengkap dengan relasi.
     */
    public function show(Pembimbing $pembimbing): Response
    {
        $pembimbing->load([
            'user:id,name,email',
        ]);

        $industry = $pembimbing->industry()->first(['id', 'name']);
        $students = $pembimbing->students()
            ->with(['users:id,email'])
            ->latest('students.created_at')
            ->get(['students.id', 'students.name', 'students.nis', 'students.user_id']);

        return Inertia::render('pembimbings/show', [
            'pembimbing' => [
                'id' => $pembimbing->id,
                'name' => $pembimbing->name,
                'email' => $pembimbing->user?->email,
                'no_hp' => $pembimbing->no_hp,
                'gender' => match (strtolower($pembimbing->gender ?? '')) {
                    'male', 'm', 'l' => 'Laki-laki',
                    'female', 'f', 'p' => 'Perempuan',
                    default => '—',
                },
                'industri' => $industry?->name,
            ],
            'students' => $students->map(fn ($student) => [
                'id' => $student->id,
                'name' => $student->name,
                'nis' => $student->nis,
                'email' => $student->users?->email,
            ])->toArray(),
            'total_students' => $students->count(),
        ]);
    }

    /**
     * Hapus pembimbing beserta akunnya.
     */
    public function destroy(Pembimbing $pembimbing): RedirectResponse
    {
        if ($pembimbing->industry()->exists()) {
            return back()->with('error', 'Pembimbing tidak bisa dihapus karena masih terkait industri.');
        }

        $user = $pembimbing->user;

        // Profil pembimbing selalu ikut dilepas: tanpa peran `pembimbing` ia
        // hanya akan memicu spanduk "akun belum ditautkan".
        $pembimbing->delete();

        if (! $user) {
            return back()->with('success', 'Pembimbing berhasil dihapus.');
        }

        $deleted = $this->detachRole($user, 'pembimbing');

        return back()->with('success', $this->detachMessage($user, $deleted, 'Pembimbing industri'));
    }

    /**
     * Opsi industri untuk form, menandai yang sudah dipegang pembimbing lain.
     *
     * Satu industri hanya menampung satu pembimbing (`industries.pembimbing_id`
     * kolom tunggal), jadi memilih industri yang sudah dipegang akan menggeser
     * pemegang lamanya — form perlu mengatakannya, bukan mendiamkannya.
     *
     * @return array<int, array{id: int, name: string, taken_by: string|null}>
     */
    private function industryOptions(?int $exceptPembimbingId = null): array
    {
        return Industry::query()
            ->with('pembimbingNormatif:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'pembimbing_id'])
            ->map(fn (Industry $industry): array => [
                'id' => $industry->id,
                'name' => $industry->name,
                'taken_by' => $industry->pembimbing_id !== null && $industry->pembimbing_id !== $exceptPembimbingId
                    ? $industry->pembimbingNormatif?->name
                    : null,
            ])
            ->all();
    }

    /**
     * Tetapkan industri yang dibimbing: klaim yang dipilih, lepas industri lain
     * yang sebelumnya ia pegang.
     *
     * Pembimbing lama pada industri yang diklaim akan tergeser — konsekuensi
     * kolom tunggal `industries.pembimbing_id`, dan sudah diperingatkan di form.
     */
    private function syncIndustry(Pembimbing $pembimbing, ?int $industryId): void
    {
        Industry::query()
            ->where('pembimbing_id', $pembimbing->id)
            ->when($industryId !== null, fn ($query) => $query->whereKeyNot($industryId))
            ->update(['pembimbing_id' => null]);

        if ($industryId !== null) {
            Industry::query()->whereKey($industryId)->update(['pembimbing_id' => $pembimbing->id]);
        }
    }
}
