<?php

namespace App\Http\Controllers;

use App\Exports\IndustryDudiExport;
use App\Models\Industry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class IndustryDudiReportController extends Controller
{
    /**
     * Rekap data profil industri (DUDI) untuk kebutuhan e-Rapor Kemendikdasmen.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = (string) $request->query('status', 'all'); // 'all', 'complete', 'incomplete'

        $baseQuery = Industry::query()->with('pembimbingNormatif:id,name');

        // Total count statistics
        $allIndustries = (clone $baseQuery)->get();
        $total = $allIndustries->count();
        $completeCount = $allIndustries->filter(fn (Industry $i) => $i->hasCompleteDudiProfile())->count();
        $incompleteCount = $total - $completeCount;

        $industriesQuery = (clone $baseQuery)
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('bidang', 'like', "%{$search}%")
                        ->orWhere('nib', 'like', "%{$search}%")
                        ->orWhere('alamat', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        $items = $industriesQuery->get()->map(function (Industry $industry): array {
            return [
                'id' => $industry->id,
                'nib' => $industry->nib,
                'name' => $industry->name,
                'bidang' => $industry->bidang,
                'alamat' => $industry->alamat,
                'rt' => $industry->rt,
                'rw' => $industry->rw,
                'dusun' => $industry->dusun,
                'kelurahan' => $industry->kelurahan,
                'kecamatan' => $industry->kecamatan,
                'kode_pos' => $industry->kode_pos,
                'latitude' => $industry->latitude,
                'longitude' => $industry->longitude,
                'email' => $industry->email,
                'website' => $industry->website,
                'npwp' => $industry->npwp,
                'pembimbing' => $industry->pembimbingNormatif?->name,
                'complete' => $industry->hasCompleteDudiProfile(),
            ];
        });

        if ($status === 'complete') {
            $items = $items->where('complete', true)->values();
        } elseif ($status === 'incomplete') {
            $items = $items->where('complete', false)->values();
        }

        // Simple pagination on collection
        $page = max(1, $request->integer('page', 1));
        $perPage = 15;
        $totalFiltered = $items->count();
        $pagedItems = $items->slice(($page - 1) * $perPage, $perPage)->values();

        return Inertia::render('admin/industry-dudi/index', [
            'industries' => [
                'data' => $pagedItems,
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $totalFiltered,
                'last_page' => (int) ceil($totalFiltered / $perPage),
            ],
            'stats' => [
                'total' => $total,
                'complete' => $completeCount,
                'incomplete' => $incompleteCount,
            ],
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Unduh file XLSX rekapan profil industri DUDI e-Rapor.
     */
    public function export(): BinaryFileResponse
    {
        return Excel::download(
            new IndustryDudiExport,
            'Rekap_Profil_Industri_ERapor_'.now()->format('Ymd_His').'.xlsx'
        );
    }
}
