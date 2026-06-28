<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartemenRequest;
use App\Models\Departemen;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DepartemenController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $departemens = Departemen::query()
            ->withCount(['classes', 'students'])
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Departemen $departemen): array => [
                'id' => $departemen->id,
                'name' => $departemen->name,
                'slug' => $departemen->slug,
                'classes_count' => $departemen->classes_count,
                'students_count' => $departemen->students_count,
            ]);

        return Inertia::render('departemens/index', [
            'departemens' => $departemens,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(DepartemenRequest $request): RedirectResponse
    {
        $name = $request->string('name')->value();

        Departemen::create([
            'name' => $name,
            'slug' => $this->uniqueSlug($name),
        ]);

        return back()->with('success', 'Jurusan berhasil ditambahkan.');
    }

    public function update(DepartemenRequest $request, Departemen $departemen): RedirectResponse
    {
        $name = $request->string('name')->value();

        $departemen->update([
            'name' => $name,
            'slug' => $this->uniqueSlug($name, $departemen->id),
        ]);

        return back()->with('success', 'Jurusan berhasil diperbarui.');
    }

    public function destroy(Departemen $departemen): RedirectResponse
    {
        if ($departemen->classes()->exists() || $departemen->students()->exists()) {
            return back()->with('error', 'Jurusan tidak bisa dihapus karena masih memiliki kelas atau siswa.');
        }

        $departemen->delete();

        return back()->with('success', 'Jurusan berhasil dihapus.');
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 1;

        while (
            Departemen::where('slug', $slug)
                ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base.'-'.++$suffix;
        }

        return $slug;
    }
}
