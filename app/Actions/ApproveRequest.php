<?php

namespace App\Actions;

use App\Models\Approval;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\SakitIzin;
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

        if ($decision === Approval::STATUS_APPROVED) {
            if ($approval->approvable instanceof LeaveRequest) {
                $leaveRequest = $approval->approvable;
                Attendance::updateOrCreate(
                    [
                        'user_id' => $leaveRequest->user_id,
                        'date' => $leaveRequest->date->format('Y-m-d'),
                    ],
                    [
                        'status' => 'libur',
                        'absenceReason' => $leaveRequest->reason,
                        'description' => 'Libur disetujui oleh '.$approver->name.' ('.$approver->getRoleNames()->first().')',
                    ]
                );
            } elseif ($approval->approvable instanceof SakitIzin) {
                $sakitIzin = $approval->approvable;
                $approvals = $sakitIzin->approvals()->orderBy('id')->get();
                $approvalsCount = $approvals->count();
                $index = $approvals->pluck('id')->search($approval->id);

                if ($index === 0 && $approvalsCount === 1) {
                    // Stage 1 approved! Inisiasi Stage 2 (Industri/Guru)
                    Approval::create([
                        'approvable_type' => SakitIzin::class,
                        'approvable_id' => $sakitIzin->id,
                        'status' => Approval::STATUS_PENDING,
                    ]);
                } elseif ($index === 1 && $approvalsCount === 2) {
                    // Stage 2 approved! Kedua tahap disetujui, buat/update presensi
                    Attendance::updateOrCreate(
                        [
                            'user_id' => $sakitIzin->user_id,
                            'date' => $sakitIzin->date->format('Y-m-d'),
                        ],
                        [
                            'status' => $sakitIzin->type, // sakit / izin
                            'absenceReason' => $sakitIzin->reason,
                            'image' => $sakitIzin->getRawOriginal('bukti'),
                            'description' => 'Disetujui oleh Ortu & Industri/Guru ('.$approver->name.')',
                        ]
                    );
                }
            }
        }
    }

    /**
     * Cek apakah user berwenang bertindak atas approval ini.
     * Syarat: approval masih pending DAN user memiliki salah satu role eligible.
     */
    public function canAct(Approval $approval, User $approver): bool
    {
        if (! $approval->isPending()) {
            return false;
        }

        if ($approval->approvable instanceof SakitIzin) {
            $sakitIzin = $approval->approvable;
            $approvals = $sakitIzin->approvals()->orderBy('id')->get();
            $index = $approvals->pluck('id')->search($approval->id);

            if ($index === 0) {
                // Tahap 1: Ortu
                if (! $approver->hasRole('orangtua')) {
                    return false;
                }
                $student = $sakitIzin->user->students;

                return $student && $student->parent_id === $approver->parents?->id;
            } elseif ($index === 1) {
                // Tahap 2: Industri / Guru / Kaprog (fallback)
                $firstApproval = $approvals->first();
                if ($firstApproval && $firstApproval->status !== Approval::STATUS_APPROVED) {
                    return false;
                }

                return $approver->hasAnyRole(Approval::ELIGIBLE_ROLES);
            }

            return false;
        }

        return $approver->hasAnyRole(Approval::ELIGIBLE_ROLES);
    }
}
