<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use App\Models\Departemen;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    /**
     * Daftar guru dengan pencarian nama.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $teachers = Teacher::query()
            ->with(['users:id,email', 'departements:id,name'])
            ->withCount(['industries', 'students'])
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Teacher $teacher): array => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'no_hp' => $teacher->no_hp,
                'email' => $teacher->users?->email,
                'departemen' => $teacher->departements?->name,
                'departemen_id' => $teacher->departemen_id,
                'industries_count' => $teacher->industries_count,
                'students_count' => $teacher->students_count,
            ]);

        return Inertia::render('teachers/index', [
            'teachers' => $teachers,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Form tambah guru.
     */
    public function create(): Response
    {
        return Inertia::render('teachers/create', [
            'departemens' => Departemen::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Simpan guru baru beserta akun loginnya.
     */
    public function store(StoreTeacherRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            $user->assignRole('guru');

            Teacher::create([
                'user_id' => $user->id,
                'name' => $data['name'],
                'no_hp' => $data['no_hp'],
                'departemen_id' => $data['departemen_id'],
            ]);
        });

        return redirect()
            ->route('teachers.index')
            ->with('success', 'Guru berhasil ditambahkan.');
    }

    /**
     * Form edit guru.
     */
    public function edit(Teacher $teacher): Response
    {
        $teacher->load('users:id,email');

        return Inertia::render('teachers/edit', [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->users?->email,
                'no_hp' => $teacher->no_hp,
                'departemen_id' => $teacher->departemen_id,
            ],
            'departemens' => Departemen::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Perbarui guru & akunnya.
     */
    public function update(UpdateTeacherRequest $request, Teacher $teacher): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($teacher, $data): void {
            $teacher->users?->update([
                'name' => $data['name'],
                'email' => $data['email'],
            ]);

            $teacher->update([
                'name' => $data['name'],
                'no_hp' => $data['no_hp'],
                'departemen_id' => $data['departemen_id'],
            ]);
        });

        return redirect()
            ->route('teachers.index')
            ->with('success', 'Data guru berhasil diperbarui.');
    }

    /**
     * Detail guru lengkap dengan relasi.
     */
    public function show(Teacher $teacher): Response
    {
        $teacher->load([
            'users:id,name,email',
            'departements:id,name',
        ]);

        $industries = $teacher->industries()->get(['id', 'name']);

        return Inertia::render('teachers/show', [
            'teacher' => [
                'id' => $teacher->id,
                'name' => $teacher->name,
                'email' => $teacher->users?->email,
                'no_hp' => $teacher->no_hp,
                'departemen' => $teacher->departements?->name,
            ],
            'industries' => $industries->map(fn ($industry) => [
                'id' => $industry->id,
                'name' => $industry->name,
            ])->toArray(),
            'students_count' => $teacher->students()->count(),
        ]);
    }

    /**
     * Hapus guru beserta akunnya.
     */
    public function destroy(Teacher $teacher): RedirectResponse
    {
        // FK students.teacher_id cascade — tolak hapus bila masih membimbing siswa.
        if ($teacher->students()->exists()) {
            return back()->with('error', 'Guru tidak bisa dihapus karena masih membimbing siswa.');
        }

        // Menghapus user akan cascade ke record guru (FK onDelete cascade).
        $teacher->users?->delete();

        return back()->with('success', 'Guru berhasil dihapus.');
    }
}
