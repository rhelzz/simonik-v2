<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKaprogRequest;
use App\Http\Requests\UpdateKaprogRequest;
use App\Models\Departemen;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class KaprogController extends Controller
{
    /**
     * Daftar akun Kepala Program Keahlian (User dengan role kaprog) beserta
     * program keahlian (jurusan) yang dipimpinnya.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $departemenId = $request->integer('departemen_id');

        $kaprogs = User::query()
            ->role('kaprog')
            ->with(['departements:id,name,user_id'])
            ->when($search !== '', fn ($query) => $query->where(function ($query) use ($search): void {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            }))
            ->when($departemenId > 0, fn ($query) => $query->whereHas(
                'departements',
                fn ($q) => $q->where('departemens.id', $departemenId),
            ))
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn (User $kaprog): array => [
                'id' => $kaprog->id,
                'name' => $kaprog->name,
                'email' => $kaprog->email,
                'departemens' => $kaprog->departements->pluck('name')->all(),
                'created_at' => $kaprog->created_at?->translatedFormat('d M Y'),
            ]);

        return Inertia::render('kaprogs/index', [
            'kaprogs' => $kaprogs,
            'departemens' => Departemen::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'departemen_id' => $departemenId > 0 ? $departemenId : null,
            ],
        ]);
    }

    /**
     * Form tambah kaprog.
     */
    public function create(): Response
    {
        return Inertia::render('kaprogs/create', [
            'departemens' => $this->departemenOptions(),
        ]);
    }

    /**
     * Simpan akun kaprog baru + tetapkan program keahlian yang dipimpin.
     */
    public function store(StoreKaprogRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data): void {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'email_verified_at' => now(),
            ]);
            $user->assignRole('kaprog');

            $this->syncDepartemens($user, $data['departemen_ids'] ?? []);
        });

        return redirect()
            ->route('kaprogs.index')
            ->with('success', 'Kepala program berhasil ditambahkan.');
    }

    /**
     * Form edit kaprog.
     */
    public function edit(User $kaprog): Response
    {
        abort_unless($kaprog->hasRole('kaprog'), 404);

        return Inertia::render('kaprogs/edit', [
            'kaprog' => [
                'id' => $kaprog->id,
                'name' => $kaprog->name,
                'email' => $kaprog->email,
                'departemen_ids' => $kaprog->departements()->pluck('id')->all(),
            ],
            'departemens' => $this->departemenOptions($kaprog->id),
        ]);
    }

    /**
     * Perbarui akun kaprog + sinkronkan program keahlian.
     */
    public function update(UpdateKaprogRequest $request, User $kaprog): RedirectResponse
    {
        abort_unless($kaprog->hasRole('kaprog'), 404);

        $data = $request->validated();

        DB::transaction(function () use ($kaprog, $data): void {
            $kaprog->update([
                'name' => $data['name'],
                'email' => $data['email'],
                ...empty($data['password']) ? [] : ['password' => Hash::make($data['password'])],
            ]);

            $this->syncDepartemens($kaprog, $data['departemen_ids'] ?? []);
        });

        return redirect()
            ->route('kaprogs.index')
            ->with('success', 'Data kepala program berhasil diperbarui.');
    }

    /**
     * Hapus akun kaprog. Program keahlian dilepas (tidak ikut terhapus)
     * karena FK departemens.user_id cascade — detach dulu sebelum hapus.
     */
    public function destroy(User $kaprog): RedirectResponse
    {
        abort_unless($kaprog->hasRole('kaprog'), 404);

        if ($kaprog->id === Auth::id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        DB::transaction(function () use ($kaprog): void {
            Departemen::query()->where('user_id', $kaprog->id)->update(['user_id' => null]);
            $kaprog->delete();
        });

        return back()->with('success', 'Kepala program berhasil dihapus.');
    }

    /**
     * Tetapkan kepemilikan jurusan ke $user: klaim yang dipilih, lepas sisanya.
     *
     * @param  array<int, int|string>  $ids
     */
    private function syncDepartemens(User $user, array $ids): void
    {
        Departemen::query()
            ->where('user_id', $user->id)
            ->whereNotIn('id', $ids)
            ->update(['user_id' => null]);

        if ($ids !== []) {
            Departemen::query()->whereIn('id', $ids)->update(['user_id' => $user->id]);
        }
    }

    /**
     * Opsi jurusan untuk form, menandai yang sudah dipegang kaprog lain.
     *
     * @return array<int, array<string, mixed>>
     */
    private function departemenOptions(?int $currentUserId = null): array
    {
        return Departemen::query()
            ->with('users:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'user_id'])
            ->map(function (Departemen $dep) use ($currentUserId): array {
                $takenByOther = $dep->user_id !== null && $dep->user_id !== $currentUserId;

                return [
                    'id' => $dep->id,
                    'name' => $dep->name,
                    'owner' => $takenByOther ? $dep->users?->name : null,
                ];
            })
            ->all();
    }
}
