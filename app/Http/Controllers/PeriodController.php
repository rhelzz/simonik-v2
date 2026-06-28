<?php

namespace App\Http\Controllers;

use App\Http\Requests\PeriodRequest;
use App\Models\PKLPeriod;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PeriodController extends Controller
{
    /**
     * Daftar periode/gelombang PKL + jumlah siswa.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $periods = PKLPeriod::query()
            ->withCount('students')
            ->when($search !== '', fn ($query) => $query->where('name_period', 'like', "%{$search}%"))
            ->orderByDesc('start_period')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (PKLPeriod $period): array => [
                'id' => $period->id,
                'name_period' => $period->name_period,
                'start_period' => $period->start_period?->format('Y-m-d'),
                'end_period' => $period->end_period?->format('Y-m-d'),
                'students_count' => $period->students_count,
            ]);

        return Inertia::render('periods/index', [
            'periods' => $periods,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(PeriodRequest $request): RedirectResponse
    {
        PKLPeriod::create($request->validated());

        return back()->with('success', 'Periode PKL berhasil ditambahkan.');
    }

    public function update(PeriodRequest $request, PKLPeriod $period): RedirectResponse
    {
        $period->update($request->validated());

        return back()->with('success', 'Periode PKL berhasil diperbarui.');
    }

    public function destroy(PKLPeriod $period): RedirectResponse
    {
        // FK students.p_k_l_period_id nullOnDelete — aman dihapus (periode siswa jadi kosong).
        $period->delete();

        return back()->with('success', 'Periode PKL berhasil dihapus.');
    }
}
