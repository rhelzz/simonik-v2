<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLeaveRequest;
use App\Models\Approval;
use App\Models\LeaveRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    /**
     * Tampilkan form pengajuan libur dan riwayat pengajuan siswa.
     */
    public function index(Request $request): Response
    {
        $userId = (int) $request->user()->id;

        $leaveRequests = LeaveRequest::query()
            ->where('user_id', $userId)
            ->with(['approval.approver'])
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn (LeaveRequest $lr): array => [
                'id' => $lr->id,
                'date' => $lr->date->format('Y-m-d'),
                'dateLabel' => $lr->date->translatedFormat('l, d M Y'),
                'reason' => $lr->reason,
                'approval' => $lr->approval ? [
                    'id' => $lr->approval->id,
                    'status' => $lr->approval->status,
                    'approver_role' => $lr->approval->approver_role,
                    'approver' => $lr->approval->approver ? [
                        'name' => $lr->approval->approver->name,
                    ] : null,
                    'note' => $lr->approval->note,
                ] : null,
            ]);

        return Inertia::render('leave-requests/index', [
            'leaveRequests' => $leaveRequests,
        ]);
    }

    /**
     * Simpan pengajuan libur baru dan inisialisasi approval.
     */
    public function store(StoreLeaveRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $leaveRequest = LeaveRequest::create([
            'user_id' => (int) $request->user()->id,
            'date' => $validated['date'],
            'reason' => $validated['reason'],
        ]);

        Approval::initiate($leaveRequest);

        return redirect()
            ->route('leave-requests.index')
            ->with('success', 'Pengajuan libur berhasil dikirim.');
    }
}
