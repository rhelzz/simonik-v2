<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreParentRequest;
use App\Http\Requests\UpdateParentRequest;
use App\Models\Parents;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ParentController extends Controller
{
    /**
     * Daftar orang tua/wali + nama-nama anak (siswa).
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $parents = Parents::query()
            ->with(['users:id,email', 'students:id,name,parent_id'])
            ->when($search !== '', fn ($query) => $query->where('nama', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Parents $parent): array => [
                'id' => $parent->id,
                'nama' => $parent->nama,
                'gender' => $parent->gender,
                'occupation' => $parent->occupation,
                'phoneNumber' => $parent->phoneNumber,
                'email' => $parent->users?->email,
                'students' => $parent->students->pluck('name')->toArray(),
            ]);

        return Inertia::render('parents/index', [
            'parents' => $parents,
            'filters' => ['search' => $search],
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
            $user = User::create([
                'name' => $data['nama'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            $user->assignRole('orangtua');

            Parents::create([
                'user_id' => $user->id,
                'nama' => $data['nama'],
                'gender' => $data['gender'],
                'alamat' => $data['alamat'],
                'occupation' => $data['occupation'],
                'phoneNumber' => $data['phoneNumber'],
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
            $parent->users?->update([
                'name' => $data['nama'],
                'email' => $data['email'],
            ]);

            $parent->update([
                'nama' => $data['nama'],
                'gender' => $data['gender'],
                'alamat' => $data['alamat'],
                'occupation' => $data['occupation'],
                'phoneNumber' => $data['phoneNumber'],
            ]);
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
        // FK students.parent_id cascade — tolak hapus bila masih punya anak (siswa) terdaftar.
        if ($parent->students()->exists()) {
            return back()->with('error', 'Orang tua tidak bisa dihapus karena masih terhubung dengan siswa.');
        }

        // Menghapus user akan cascade ke record orang tua (FK onDelete cascade).
        $parent->users?->delete();

        return back()->with('success', 'Orang tua berhasil dihapus.');
    }
}
