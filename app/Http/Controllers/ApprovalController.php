<?php

namespace App\Http\Controllers;

use App\Actions\ApproveRequest;
use App\Models\Approval;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ApprovalController extends Controller
{
    public function __construct(private readonly ApproveRequest $action) {}

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
