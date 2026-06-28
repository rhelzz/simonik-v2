<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePembimbingRequest;
use App\Http\Requests\UpdatePembimbingRequest;
use App\Models\Pembimbing;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class PembimbingController extends Controller
{
    /**
     * Daftar pembimbing dengan pencarian nama.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        // Pembimbing industri terikat ke satu PT (industries.pembimbing_id);
        // siswa diturunkan lewat PT itu (hasManyThrough).
        $pembimbings = Pembimbing::query()
            ->with(['user:id,email', 'industry:id,name,pembimbing_id'])
            ->withCount('students')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Pembimbing $pembimbing): array => [
                'id' => $pembimbing->id,
                'name' => $pembimbing->name,
                'no_hp' => $pembimbing->no_hp,
                'gender' => $pembimbing->gender,
                'email' => $pembimbing->user?->email,
                'industry' => $pembimbing->industry?->name,
                'students_count' => $pembimbing->students_count,
            ]);

        return Inertia::render('pembimbings/index', [
            'pembimbings' => $pembimbings,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Simpan pembimbing baru beserta akun loginnya.
     */
    public function store(StorePembimbingRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            $user->assignRole('pembimbing');

            Pembimbing::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'no_hp' => $data['no_hp'],
                'gender' => $data['gender'] ?? null,
            ]);
        });

        return back()->with('success', 'Pembimbing berhasil ditambahkan.');
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
            ]);

            $pembimbing->update([
                'name' => $data['name'],
                'no_hp' => $data['no_hp'],
                'gender' => $data['gender'] ?? null,
            ]);
        });

        return back()->with('success', 'Data pembimbing berhasil diperbarui.');
    }

    /**
     * Hapus pembimbing beserta akunnya.
     */
    public function destroy(Pembimbing $pembimbing): RedirectResponse
    {
        if ($pembimbing->industry()->exists()) {
            return back()->with('error', 'Pembimbing tidak bisa dihapus karena masih terkait industri.');
        }

        // Menghapus user akan cascade ke record pembimbing (FK onDelete cascade).
        $pembimbing->user?->delete();

        return back()->with('success', 'Pembimbing berhasil dihapus.');
    }
}
