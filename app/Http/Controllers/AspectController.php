<?php

namespace App\Http\Controllers;

use App\Http\Requests\AspectRequest;
use App\Models\AspekProduktif;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AspectController extends Controller
{
    /**
     * Master aspek penilaian (teknis & non-teknis), di-CRUD admin/kaprog.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        $aspects = AspekProduktif::query()
            ->withCount('evaluations')
            ->when($search !== '', fn ($query) => $query->where('kemampuan', 'like', "%{$search}%"))
            ->orderBy('category')
            ->orderBy('no')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (AspekProduktif $aspek): array => [
                'id' => $aspek->id,
                'category' => $aspek->category,
                'no' => $aspek->no,
                'kemampuan' => $aspek->kemampuan,
                'evaluations_count' => $aspek->evaluations_count,
            ]);

        return Inertia::render('aspects/index', [
            'aspects' => $aspects,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(AspectRequest $request): RedirectResponse
    {
        AspekProduktif::create($request->validated());

        return back()->with('success', 'Aspek penilaian berhasil ditambahkan.');
    }

    public function update(AspectRequest $request, AspekProduktif $aspect): RedirectResponse
    {
        $aspect->update($request->validated());

        return back()->with('success', 'Aspek penilaian berhasil diperbarui.');
    }

    public function destroy(AspekProduktif $aspect): RedirectResponse
    {
        // FK evaluations.aspek_produktif_id cascade — skor ikut terhapus.
        $aspect->delete();

        return back()->with('success', 'Aspek penilaian berhasil dihapus.');
    }
}
