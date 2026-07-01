<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateKuotaRequest;
use App\Models\Industry;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Manajemen Kemitraan + Kuota (M5.2). Admin/Wakasek menetapkan kuota penerimaan
 * siswa PKL per industri; halaman menandai kuota terisi / penuh / kelebihan.
 */
class PartnershipController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $partners = Industry::query()
            ->withCount('students')
            ->when($search !== '', fn (Builder $query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString()
            ->through(function (Industry $industry): array {
                $placed = $industry->students_count;
                $kuota = $industry->kuota;

                return [
                    'id' => $industry->id,
                    'name' => $industry->name,
                    'bidang' => $industry->bidang,
                    'kuota' => $kuota,
                    'placed' => $placed,
                    'remaining' => $kuota === null ? null : max(0, $kuota - $placed),
                    'over' => $kuota !== null && $placed > $kuota,
                    'full' => $kuota !== null && $placed >= $kuota,
                ];
            });

        // Ringkasan lintas mitra (abaikan mitra tanpa kuota untuk daya tampung).
        $withQuota = Industry::query()->whereNotNull('kuota');

        return Inertia::render('partnerships/index', [
            'partners' => $partners,
            'filters' => ['search' => $search],
            'summary' => [
                'partners' => Industry::query()->count(),
                'capacity' => (int) (clone $withQuota)->sum('kuota'),
                'placed' => (int) (clone $withQuota)->withCount('students')->get()->sum('students_count'),
                'overCapacity' => (clone $withQuota)
                    ->withCount('students')
                    ->get()
                    ->filter(fn (Industry $i): bool => $i->students_count > (int) $i->kuota)
                    ->count(),
            ],
        ]);
    }

    public function updateKuota(UpdateKuotaRequest $request, Industry $industry): RedirectResponse
    {
        $industry->update(['kuota' => $request->validated()['kuota'] ?? null]);

        return back()->with('success', 'Kuota mitra berhasil diperbarui.');
    }
}
