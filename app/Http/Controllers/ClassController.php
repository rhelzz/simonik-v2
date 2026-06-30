<?php

namespace App\Http\Controllers;

use App\Http\Requests\ClassRequest;
use App\Models\Classes;
use App\Models\Departemen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ClassController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $classes = Classes::query()
            ->with('departemens:id,name')
            ->withCount('students')
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Classes $class): array => [
                'id' => $class->id,
                'name' => $class->name,
                'slug' => $class->slug,
                'departemen' => $class->departemens?->name,
                'departemen_id' => $class->departemen_id,
                'students_count' => $class->students_count,
            ]);

        return Inertia::render('classes/index', [
            'classes' => $classes,
            'departemens' => Departemen::orderBy('name')->get(['id', 'name']),
            'filters' => ['search' => $search],
        ]);
    }

    public function show(Classes $class): Response
    {
        $class->load('departemens:id,name');

        $students = $class->students()
            ->with('industries:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'nis', 'gender', 'status_pkl', 'industri_id']);

        return Inertia::render('classes/show', [
            'class' => [
                'id' => $class->id,
                'name' => $class->name,
                'slug' => $class->slug,
                'departemen' => $class->departemens?->name,
                'students_count' => $students->count(),
            ],
            'students' => $students->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'nis' => $s->nis,
                'gender' => $s->gender === 'L' ? 'Laki-laki' : 'Perempuan',
                'status_pkl' => $s->status_pkl,
                'industri' => $s->industries?->name,
            ]),
        ]);
    }

    public function store(ClassRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Classes::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
            'departemen_id' => $data['departemen_id'],
        ]);

        return back()->with('success', 'Kelas berhasil ditambahkan.');
    }

    public function update(ClassRequest $request, Classes $class): RedirectResponse
    {
        $data = $request->validated();

        $class->update([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name'], $class->id),
            'departemen_id' => $data['departemen_id'],
        ]);

        return back()->with('success', 'Kelas berhasil diperbarui.');
    }

    public function destroy(Classes $class): RedirectResponse
    {
        if ($class->students()->exists()) {
            return back()->with('error', 'Kelas tidak bisa dihapus karena masih memiliki siswa.');
        }

        $class->delete();

        return back()->with('success', 'Kelas berhasil dihapus.');
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (
            Classes::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.++$suffix;
        }

        return $slug;
    }
}
