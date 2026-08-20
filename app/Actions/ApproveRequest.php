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
                $index = $approvals->pluck('id')->search($approval->id);

                // Sejak v2.4 Fase 26 pengajuan Sakit/Izin hanya SATU tahap:
                // approval pertama yang disetujui langsung menghasilkan baris
                // presensi. Cabang index 1 dipertahankan semata untuk
                // menuntaskan pengajuan LAMA yang terlanjur dua tahap.
                if ($index === 0 || $index === 1) {
                    $this->recordSakitIzin($sakitIzin, $approver);
                }
            }
        }
    }

    /**
     * Catat presensi hasil pengajuan Sakit/Izin yang disetujui.
     *
     * Diekstrak agar alur satu-tahap (baru) dan alur dua-tahap (data lama)
     * tidak punya dua salinan yang bisa berbeda diam-diam.
     *
     * getRawOriginal('bukti') WAJIB: accessor SakitIzin::bukti() mengubah
     * nilainya jadi URL asset(), dan menyimpan URL ke kolom `image` akan
     * merusak tampilan foto di rekap absen.
     */
    private function recordSakitIzin(SakitIzin $sakitIzin, User $approver): void
    {
        Attendance::updateOrCreate(
            [
                'user_id' => $sakitIzin->user_id,
                'date' => $sakitIzin->date->format('Y-m-d'),
            ],
            [
                'status' => $sakitIzin->type, // sakit / izin
                'absenceReason' => $sakitIzin->reason,
                'image' => $sakitIzin->getRawOriginal('bukti'),
                'description' => 'Disetujui oleh '.$approver->name.' ('.$approver->getRoleNames()->first().')',
            ]
        );
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

            // Tahap tunggal (Fase 26): Guru Pembimbing / Pembimbing Industri /
            // Kaprog sebagai fallback. Orang Tua tidak lagi terlibat.
            if ($index === 0) {
                return $approver->hasAnyRole(Approval::ELIGIBLE_ROLES);
            }

            // Pengajuan LAMA yang terlanjur dua tahap: tahap 2 hanya bisa
            // diproses kalau tahap 1 sudah disetujui. Cabang ini tidak pernah
            // dibuat lagi oleh alur baru — lihat catatan penghapusannya di
            // docs/v2.4/26-FASE-26-SAKIT-TANPA-ORTU.md §3.3.
            if ($index === 1) {
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
