<?php

namespace App\Http\Controllers;

use App\Exports\ParentExport;
use App\Http\Controllers\Concerns\HandlesImportExport;
use App\Http\Requests\StoreParentRequest;
use App\Http\Requests\UpdateParentRequest;
use App\Imports\ParentImport;
use App\Models\Parents;
use App\Models\User;
use App\Support\ImportTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ParentController extends Controller
{
    use HandlesImportExport;

    public function export(): BinaryFileResponse
    {
        return Excel::download(new ParentExport, 'data-orangtua.xlsx');
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(ImportTemplates::parent(), 'template-impor-orangtua.xlsx');
    }

    public function import(Request $request): RedirectResponse
    {
        return $this->runImport($request, new ParentImport, 'parents.index');
    }

    /**
     * Daftar orang tua/wali + nama-nama anak (siswa).
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

        $parents = Parents::query()
            ->with(['users:id,email', 'students:id,name,parent_id'])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('nama', 'like', "%{$search}%")
                        ->orWhere('occupation', 'like', "%{$search}%")
                        ->orWhere('phoneNumber', 'like', "%{$search}%");
                });
            })
            ->when($aliases !== null, fn ($query) => $query->whereIn('gender', $aliases))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Parents $parent): array => [
                'id' => $parent->id,
                'nama' => $parent->nama,
                'gender' => match (strtolower($parent->gender ?? '')) {
                    'male', 'm', 'l' => 'Ayah',
                    'female', 'f', 'p' => 'Ibu',
                    default => null,
                },
                'occupation' => $parent->occupation,
                'phoneNumber' => $parent->phoneNumber,
                'email' => $parent->users?->email,
                'students' => $parent->students->pluck('name')->toArray(),
            ]);

        return Inertia::render('parents/index', [
            'parents' => $parents,
            'filters' => [
                'search' => $search,
                'gender' => $aliases !== null ? $gender : null,
            ],
        ]);
    }

    /**
     * Form tambah orang tua.
     */
    public function create(): Response
    {
        return Inertia::render('parents/create');
    }

    /**
     * Simpan orang tua baru beserta akun loginnya.
     */
    public function store(StoreParentRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $userId = null;

            if (! empty($data['email']) && ! empty($data['password'])) {
                $user = User::create([
                    'name' => $data['nama'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'email_verified_at' => now(),
                ]);
                $user->assignRole('orangtua');
                $userId = $user->id;
            }

            Parents::create([
                'user_id' => $userId,
                'nama' => $data['nama'],
                'gender' => $data['gender'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'occupation' => $data['occupation'] ?? null,
                'phoneNumber' => $data['phoneNumber'] ?? null,
            ]);
        });

        return redirect()
            ->route('parents.index')
            ->with('success', 'Orang tua berhasil ditambahkan.');
    }

    /**
     * Form edit orang tua.
     */
    public function edit(Parents $parent): Response
    {
        $parent->load('users:id,email');

        return Inertia::render('parents/edit', [
            'parent' => [
                'id' => $parent->id,
                'nama' => $parent->nama,
                'email' => $parent->users?->email,
                'gender' => $parent->gender,
                'alamat' => $parent->alamat,
                'occupation' => $parent->occupation,
                'phoneNumber' => $parent->phoneNumber,
            ],
        ]);
    }

    /**
     * Perbarui orang tua & akunnya.
     */
    public function update(UpdateParentRequest $request, Parents $parent): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($parent, $data): void {
            if ($parent->users) {
                $parent->users->update([
                    'name' => $data['nama'],
                    ...empty($data['email']) ? [] : ['email' => $data['email']],
                    ...empty($data['password']) ? [] : ['password' => Hash::make($data['password'])],
                ]);
            } elseif (! empty($data['email']) && ! empty($data['password'])) {
                // Parent belum punya akun — lengkapi sekarang.
                $user = User::create([
                    'name' => $data['nama'],
                    'email' => $data['email'],
                    'password' => Hash::make($data['password']),
                    'email_verified_at' => now(),
                ]);
                $user->assignRole('orangtua');
                $parent->user_id = $user->id;
            }

            $parent->fill([
                'nama' => $data['nama'],
                'gender' => $data['gender'] ?? null,
                'alamat' => $data['alamat'] ?? null,
                'occupation' => $data['occupation'] ?? null,
                'phoneNumber' => $data['phoneNumber'] ?? null,
            ])->save();
        });

        return redirect()
            ->route('parents.index')
            ->with('success', 'Data orang tua berhasil diperbarui.');
    }

    /**
     * Hapus orang tua beserta akunnya.
     */
    public function destroy(Parents $parent): RedirectResponse
    {
        // FK students.parent_id nullOnDelete — tolak hapus agar tautan anak
        // (siswa) tidak diam-diam terlepas.
        if ($parent->students()->exists()) {
            return back()->with('error', 'Orang tua tidak bisa dihapus karena masih terhubung dengan siswa.');
        }

        // Menghapus user akan cascade ke record orang tua (FK onDelete cascade).
        // Kalau belum punya akun, hapus record orang tua langsung.
        if ($parent->users) {
            $parent->users->delete();
        } else {
            $parent->delete();
        }

        return back()->with('success', 'Orang tua berhasil dihapus.');
    }
}
