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
        $gender = (string) $request->query('gender', '');
        $gender = in_array($gender, ['L', 'P'], true) ? $gender : '';

        // Nilai gender bisa bervariasi antar-sumber data (L/P vs male/female);
        // padankan keduanya saat memfilter.
        $genderAliases = [
            'L' => ['L', 'l', 'male', 'm'],
            'P' => ['P', 'p', 'female', 'f'],
        ];

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
            ->when($gender !== '', fn ($query) => $query->whereIn('gender', $genderAliases[$gender]))
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
                'gender' => $gender !== '' ? $gender : null,
            ],
        ]);
    }

    /**
     * Form tambah pembimbing.
     */
    public function create(): Response
    {
        return Inertia::render('pembimbings/create');
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

        return redirect()
            ->route('pembimbings.index')
            ->with('success', 'Pembimbing berhasil ditambahkan.');
    }

    /**
     * Form edit pembimbing.
     */
    public function edit(Pembimbing $pembimbing): Response
    {
        $pembimbing->load('user:id,email');

        return Inertia::render('pembimbings/edit', [
            'pembimbing' => [
                'id' => $pembimbing->id,
                'name' => $pembimbing->name,
                'email' => $pembimbing->user?->email,
                'no_hp' => $pembimbing->no_hp,
                'gender' => $pembimbing->gender,
            ],
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
            ]);

            $pembimbing->update([
                'name' => $data['name'],
                'no_hp' => $data['no_hp'],
                'gender' => $data['gender'] ?? null,
            ]);
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

        // Menghapus user akan cascade ke record pembimbing (FK onDelete cascade).
        $pembimbing->user?->delete();

        return back()->with('success', 'Pembimbing berhasil dihapus.');
    }
}
