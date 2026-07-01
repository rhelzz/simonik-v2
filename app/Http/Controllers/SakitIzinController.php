<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSakitIzinRequest;
use App\Models\Approval;
use App\Models\SakitIzin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SakitIzinController extends Controller
{
    /**
     * Tampilkan form pengajuan sakit/izin dan riwayat pengajuan siswa.
     */
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;

        $sakitIzins = SakitIzin::query()
            ->where('user_id', $userId)
            ->with(['approvals.approver'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn (SakitIzin $si, int $index): array => [
                'id' => $si->id,
                'date' => $si->date->format('Y-m-d'),
                'dateLabel' => $si->date->translatedFormat('l, d M Y'),
                'type' => $si->type,
                'typeLabel' => $si->type === 'sakit' ? 'Sakit' : 'Izin',
                'reason' => $si->reason,
                'bukti' => $si->bukti,
                'approvals' => $si->approvals->map(fn ($app): array => [
                    'id' => $app->id,
                    'status' => $app->status,
                    'approver_role' => $app->approver_role,
                    'approver' => $app->approver ? ['name' => $app->approver->name] : null,
                    'note' => $app->note,
                ])->all(),
            ]);

        return Inertia::render('sakit-izin/index', [
            'sakitIzins' => $sakitIzins,
        ]);
    }

    /**
     * Simpan pengajuan sakit/izin baru dan inisialisasi approval Ortu.
     */
    public function store(StoreSakitIzinRequest $request): RedirectResponse
    {
        $student = $request->user()->students;
        if (! $student || ! $student->parent_id || ! $student->parents?->users?->hasRole('orangtua')) {
            return back()->withErrors(['date' => 'Anda harus menautkan akun Orang Tua terlebih dahulu sebelum mengajukan sakit/izin.']);
        }

        $validated = $request->validated();
        $path = $request->file('bukti')->store('sakit_izins', 'public');

        $sakitIzin = SakitIzin::create([
            'user_id' => (int) $request->user()->id,
            'date' => $validated['date'],
            'type' => $validated['type'],
            'reason' => $validated['reason'],
            'bukti' => $path,
        ]);

        Approval::initiate($sakitIzin);

        return redirect()
            ->route('sakit-izin.index')
            ->with('success', 'Pengajuan Sakit/Izin berhasil dikirim dan menunggu persetujuan Orang Tua.');
    }
}
