<?php

namespace App\Http\Controllers;

use App\Actions\ApproveRequest;
use App\Models\Approval;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\SakitIzin;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ApprovalController extends Controller
{
    public function __construct(private readonly ApproveRequest $action) {}

    /**
     * Tampilkan antrian persetujuan (inbox) atau riwayat persetujuan user.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasAnyRole(['pembimbing', 'guru', 'kaprog', 'orangtua'])) {
            abort(403, 'Anda tidak memiliki akses ke inbox persetujuan.');
        }

        $status = $request->input('status', 'pending');

        $query = Approval::query();
        if ($status === 'pending') {
            $query->forUserQueue($user)->where('status', Approval::STATUS_PENDING);
        } else {
            $query->where('approver_id', $user->id);
        }

        $approvals = $query->with(['approver'])
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function (Approval $app) {
                $studentName = 'Siswa';
                $dateLabel = '';
                $typeLabel = '';
                $reason = '';
                $bukti = null;

                $approvable = $app->approvable;
                if ($approvable instanceof LeaveRequest) {
                    $studentName = $approvable->user->name;
                    $dateLabel = $approvable->date->translatedFormat('l, d M Y');
                    $typeLabel = 'Pengajuan Libur';
                    $reason = $approvable->reason;
                } elseif ($approvable instanceof SakitIzin) {
                    $studentName = $approvable->user->name;
                    $dateLabel = $approvable->date->translatedFormat('l, d M Y');
                    $typeLabel = $approvable->type === 'sakit' ? 'Sakit' : 'Izin';
                    $reason = $approvable->reason;
                    $bukti = $approvable->bukti;
                } elseif ($approvable instanceof Attendance) {
                    $studentName = $approvable->users->name;
                    $dateLabel = $approvable->date->translatedFormat('l, d M Y');
                    $typeLabel = 'Kehadiran WFA ('.($approvable->status === 'masuk' ? 'Masuk' : 'Pulang').')';
                    $reason = $approvable->absenceReason ?? 'WFA Kehadiran';
                    $bukti = $approvable->image;
                }

                return [
                    'id' => $app->id,
                    'status' => $app->status,
                    'approver_role' => $app->approver_role,
                    'approver' => $app->approver ? ['name' => $app->approver->name] : null,
                    'note' => $app->note,
                    'studentName' => $studentName,
                    'dateLabel' => $dateLabel,
                    'typeLabel' => $typeLabel,
                    'reason' => $reason,
                    'bukti' => $bukti,
                ];
            });

        return Inertia::render('approvals/index', [
            'approvals' => $approvals,
            'statusFilter' => $status,
        ]);
    }

    public function approve(Request $request, Approval $approval): RedirectResponse
    {
        Gate::authorize('act', $approval);

        /** @var User $user */
        $user = $request->user();

        $this->action->handle($approval, $user, Approval::STATUS_APPROVED, $request->input('note'));

        return back()->with('success', 'Permintaan berhasil disetujui.');
    }

    public function reject(Request $request, Approval $approval): RedirectResponse
    {
        Gate::authorize('act', $approval);

        /** @var User $user */
        $user = $request->user();

        $this->action->handle($approval, $user, Approval::STATUS_REJECTED, $request->input('note'));

        return back()->with('success', 'Permintaan berhasil ditolak.');
    }
}
