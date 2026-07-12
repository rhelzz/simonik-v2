<?php

namespace App\Http\Controllers;

use App\Exports\ClassExport;
use App\Http\Controllers\Concerns\HandlesImportExport;
use App\Http\Requests\ClassRequest;
use App\Imports\ClassImport;
use App\Models\Classes;
use App\Models\Departemen;
use App\Support\ImportTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ClassController extends Controller
{
    use HandlesImportExport;

    public function export(): BinaryFileResponse
    {
        return Excel::download(new ClassExport, 'data-kelas.xlsx');
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(ImportTemplates::kelas(), 'template-impor-kelas.xlsx');
    }

    public function import(Request $request): RedirectResponse
    {
        return $this->runImport($request, new ClassImport, 'classes.index');
    }

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
            'filters' => ['search' => $search],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('classes/create', [
            'departemens' => Departemen::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function edit(Classes $class): Response
    {
        return Inertia::render('classes/edit', [
            'class' => [
                'id' => $class->id,
                'name' => $class->name,
                'departemen_id' => $class->departemen_id,
            ],
            'departemens' => Departemen::orderBy('name')->get(['id', 'name']),
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

        return to_route('classes.index')->with('success', 'Kelas berhasil ditambahkan.');
    }

    public function update(ClassRequest $request, Classes $class): RedirectResponse
    {
        $data = $request->validated();

        $class->update([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name'], $class->id),
            'departemen_id' => $data['departemen_id'],
        ]);

        return to_route('classes.index')->with('success', 'Kelas berhasil diperbarui.');
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
