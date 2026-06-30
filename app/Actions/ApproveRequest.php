<?php

namespace App\Actions;

use App\Models\Approval;
use App\Models\User;

/**
 * First-to-Approve engine: sah bila salah satu approver eligible menyetujui.
 * Roles eligible: pembimbing dan guru (primary); kaprog (fallback/safety-net).
 */
class ApproveRequest
{
    /**
     * Proses keputusan approve atau reject oleh approver yang berwenang.
     *
     * @param  'approved'|'rejected'  $decision
     */
    public function handle(Approval $approval, User $approver, string $decision, ?string $note = null): void
    {
        $approval->update([
            'status' => $decision,
            'approver_role' => $approver->getRoleNames()->first(),
            'approver_id' => $approver->id,
            'note' => $note,
        ]);
    }

    /**
     * Cek apakah user berwenang bertindak atas approval ini.
     * Syarat: approval masih pending DAN user memiliki salah satu role eligible.
     */
    public function canAct(Approval $approval, User $approver): bool
    {
        return $approval->isPending()
            && $approver->hasAnyRole(Approval::ELIGIBLE_ROLES);
    }
}
