<?php

namespace App\Http\Controllers;

use App\Exports\WakasekExport;
use App\Http\Controllers\Concerns\HandlesImportExport;
use App\Http\Requests\StoreWakasekRequest;
use App\Http\Requests\UpdateWakasekRequest;
use App\Imports\WakasekImport;
use App\Models\User;
use App\Support\ImportTemplates;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class WakasekController extends Controller
{
    use HandlesImportExport;

    public function export(): BinaryFileResponse
    {
        return Excel::download(new WakasekExport, 'data-wakasek.xlsx');
    }

    public function template(): BinaryFileResponse
    {
        return Excel::download(ImportTemplates::wakasek(), 'template-impor-wakasek.xlsx');
    }

    public function import(Request $request): RedirectResponse
    {
        return $this->runImport($request, new WakasekImport, 'wakaseks.index');
    }

    /**
     * Daftar akun Wakasek Humas/Hubin (User dengan role wakasek).
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $wakaseks = User::query()
            ->role('wakasek')
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $wakasek): array => [
                'id' => $wakasek->id,
                'name' => $wakasek->name,
                'email' => $wakasek->email,
                'created_at' => $wakasek->created_at?->translatedFormat('d M Y'),
            ]);

        return Inertia::render('wakaseks/index', [
            'wakaseks' => $wakaseks,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Form tambah wakasek.
     */
    public function create(): Response
    {
        return Inertia::render('wakaseks/create');
    }

    /**
     * Simpan akun wakasek baru.
     */
    public function store(StoreWakasekRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);
        $user->assignRole('wakasek');

        return redirect()
            ->route('wakaseks.index')
            ->with('success', 'Wakasek berhasil ditambahkan.');
    }

    /**
     * Form edit wakasek.
     */
    public function edit(User $wakasek): Response
    {
        abort_unless($wakasek->hasRole('wakasek'), 404);

        return Inertia::render('wakaseks/edit', [
            'wakasek' => [
                'id' => $wakasek->id,
                'name' => $wakasek->name,
                'email' => $wakasek->email,
            ],
        ]);
    }

    /**
     * Perbarui akun wakasek.
     */
    public function update(UpdateWakasekRequest $request, User $wakasek): RedirectResponse
    {
        abort_unless($wakasek->hasRole('wakasek'), 404);

        $data = $request->validated();

        $wakasek->update([
            'name' => $data['name'],
            'email' => $data['email'],
            ...empty($data['password']) ? [] : ['password' => Hash::make($data['password'])],
        ]);

        return redirect()
            ->route('wakaseks.index')
            ->with('success', 'Data wakasek berhasil diperbarui.');
    }

    /**
     * Hapus akun wakasek.
     */
    public function destroy(User $wakasek): RedirectResponse
    {
        abort_unless($wakasek->hasRole('wakasek'), 404);

        // Cegah menghapus akun sendiri.
        if ($wakasek->id === Auth::id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $wakasek->delete();

        return back()->with('success', 'Wakasek berhasil dihapus.');
    }
}
