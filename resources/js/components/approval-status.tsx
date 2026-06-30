import { useForm } from '@inertiajs/react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import {
    approve,
    reject,
} from '@/actions/App/Http/Controllers/ApprovalController';
import { cn } from '@/lib/utils';

export type ApprovalData = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    approver_role: string | null;
    note: string | null;
};

const STATUS_CONFIG = {
    pending: {
        label: 'Menunggu',
        icon: Clock,
        className: 'bg-warning/10 text-warning',
    },
    approved: {
        label: 'Disetujui',
        icon: CheckCircle,
        className: 'bg-positive/10 text-positive',
    },
    rejected: {
        label: 'Ditolak',
        icon: XCircle,
        className: 'bg-red-500/10 text-red-500',
    },
} as const;

const ROLE_LABELS: Record<string, string> = {
    pembimbing: 'Pembimbing Industri',
    guru: 'Guru Pembimbing',
    kaprog: 'Kepala Program',
};

/**
 * Badge status approval + tombol Setujui/Tolak (jika canAct).
 * Komponen reusable untuk semua fitur yang membutuhkan approval engine (WFA, Libur, Sakit/Izin).
 */
export function ApprovalStatus({
    approval,
    canAct,
}: {
    approval: ApprovalData;
    canAct: boolean;
}) {
    const config = STATUS_CONFIG[approval.status];
    const Icon = config.icon;

    return (
        <div className="space-y-3">
            {/* Status badge */}
            <div
                className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium',
                    config.className,
                )}
            >
                <Icon className="size-4" />
                {config.label}
            </div>

            {/* Info siapa yang approve/reject */}
            {approval.status !== 'pending' && approval.approver_role && (
                <p className="text-sm text-muted">
                    oleh{' '}
                    <span className="font-medium text-ink">
                        {ROLE_LABELS[approval.approver_role] ??
                            approval.approver_role}
                    </span>
                </p>
            )}

            {/* Catatan */}
            {approval.note && (
                <p className="rounded-lg bg-line/50 px-3 py-2 text-sm text-ink">
                    {approval.note}
                </p>
            )}

            {/* Tombol aksi (hanya saat pending & canAct) */}
            {canAct && approval.status === 'pending' && (
                <ApprovalActions approvalId={approval.id} />
            )}
        </div>
    );
}

function ApprovalActions({ approvalId }: { approvalId: number }) {
    const approveForm = useForm<{ note: string }>({ note: '' });
    const rejectForm = useForm<{ note: string }>({ note: '' });

    function handleApprove() {
        approveForm.post(approve(approvalId).url);
    }

    function handleReject() {
        rejectForm.post(reject(approvalId).url);
    }

    return (
        <div className="flex flex-col gap-2 sm:flex-row">
            <button
                type="button"
                onClick={handleApprove}
                disabled={approveForm.processing || rejectForm.processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-positive px-4 py-2 text-sm font-semibold text-white transition hover:bg-positive/90 disabled:opacity-50"
            >
                <CheckCircle className="size-4" />
                Setujui
            </button>
            <button
                type="button"
                onClick={handleReject}
                disabled={approveForm.processing || rejectForm.processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
            >
                <XCircle className="size-4" />
                Tolak
            </button>
        </div>
    );
}
