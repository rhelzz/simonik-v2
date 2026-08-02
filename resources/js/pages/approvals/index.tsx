import { Link, router } from '@inertiajs/react';
import {
    CheckCircle,
    XCircle,
    FileText,
    ExternalLink,
    Inbox,
} from 'lucide-react';
import { useState } from 'react';
import {
    approve,
    reject,
} from '@/actions/App/Http/Controllers/ApprovalController';
import { Pagination } from '@/components/ui/pagination';
import { ScopeNote } from '@/components/ui/scope-note';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ApprovalItem = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    approver_role: string | null;
    approver: { name: string } | null;
    note: string | null;
    studentName: string;
    dateLabel: string;
    typeLabel: string;
    reason: string;
    bukti: string | null;
};

type Props = {
    approvals: Paginated<ApprovalItem>;
    statusFilter: 'pending' | 'history';
    scopeLabel: string;
};

export default function ApprovalsIndex({
    approvals,
    statusFilter,
    scopeLabel,
}: Props) {
    const isPendingTab = statusFilter === 'pending';

    return (
        <AppLayout title="Inbox Persetujuan">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                        Inbox Persetujuan
                    </h1>
                    <p className="text-sm text-muted">
                        Proses pengajuan WFA, Libur, dan Sakit/Izin siswa dalam
                        cakupan Anda.
                    </p>
                    <ScopeNote label={scopeLabel} />
                </div>

                {/* Tabs */}
                <div className="flex border-b border-line">
                    <Link
                        href="/approvals?status=pending"
                        className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                            isPendingTab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Antrian Pending
                    </Link>
                    <Link
                        href="/approvals?status=history"
                        className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                            !isPendingTab
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted hover:text-ink'
                        }`}
                    >
                        Riwayat Keputusan
                    </Link>
                </div>

                {/* Content */}
                {approvals.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface p-12 text-center">
                        <span className="mb-4 grid size-12 place-items-center rounded-xl bg-canvas text-muted">
                            <Inbox className="size-6" />
                        </span>
                        <h3 className="text-base font-bold text-ink">
                            {isPendingTab
                                ? 'Belum ada pengajuan menunggu'
                                : 'Tidak ada riwayat'}
                        </h3>
                        {/* Antrian kosong dulu terbaca sebagai "fitur setujui/
                            tolak tidak ada". Terangkan apa yang akan muncul
                            di sini dan dari mana asalnya. */}
                        <p className="mt-1 max-w-md text-sm text-muted">
                            {isPendingTab
                                ? 'Halaman ini terisi otomatis ketika siswa dalam cakupan Anda mengajukan absen dari luar lokasi (WFA), libur, atau sakit/izin. Tombol Setujui dan Tolak beserta kolom catatan akan muncul pada tiap pengajuan yang masuk.'
                                : 'Anda belum pernah menyetujui atau menolak pengajuan apapun.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {approvals.data.map((item) => (
                            <ApprovalCard
                                key={item.id}
                                item={item}
                                isPendingTab={isPendingTab}
                            />
                        ))}

                        <Pagination meta={approvals} />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function ApprovalCard({
    item,
    isPendingTab,
}: {
    item: ApprovalItem;
    isPendingTab: boolean;
}) {
    const [note, setNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    /**
     * Kirim keputusan beserta catatannya. Catatan diambil langsung dari state
     * saat submit — `useForm().setData()` baru berlaku di render berikutnya,
     * sehingga catatan selalu terkirim kosong bila memakai form helper.
     */
    function decide(url: string) {
        setIsProcessing(true);
        router.post(
            url,
            { note },
            {
                preserveScroll: true,
                onSuccess: () => setNote(''),
                onFinish: () => setIsProcessing(false),
            },
        );
    }

    return (
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:shadow-md md:flex-row md:items-start">
            <div className="min-w-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        {item.typeLabel}
                    </span>
                    <span className="text-xs font-medium text-muted">
                        {item.dateLabel}
                    </span>
                </div>

                <div className="space-y-1">
                    <h3 className="truncate text-base font-bold text-ink">
                        {item.studentName}
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted">
                        {item.reason}
                    </p>
                </div>

                {item.bukti && (
                    <div className="pt-1">
                        <a
                            href={item.bukti}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-line/50"
                        >
                            <FileText className="size-3.5 text-primary" />
                            <span>Lihat Lampiran / Bukti</span>
                            <ExternalLink className="size-3 text-muted" />
                        </a>
                    </div>
                )}

                {!isPendingTab && (
                    <div className="space-y-2 border-t border-line/50 pt-2">
                        <div className="flex items-center gap-2">
                            <span
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                    item.status === 'approved'
                                        ? 'bg-positive/10 text-positive'
                                        : 'bg-red-500/10 text-red-500'
                                }`}
                            >
                                {item.status === 'approved'
                                    ? 'Disetujui'
                                    : 'Ditolak'}
                            </span>
                            {item.approver && (
                                <span className="text-xs text-muted">
                                    oleh {item.approver.name}
                                </span>
                            )}
                        </div>
                        {item.note && (
                            <p className="rounded-lg border border-line/50 bg-canvas px-2.5 py-1.5 text-xs text-muted italic">
                                Catatan: {item.note}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {isPendingTab && (
                <div className="w-full shrink-0 space-y-3 border-t border-line/50 pt-4 md:w-72 md:border-t-0 md:pt-0">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-muted">
                            Catatan Keputusan
                        </label>
                        <input
                            type="text"
                            placeholder="Catatan opsional..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            disabled={isProcessing}
                            className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none disabled:opacity-50"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => decide(approve(item.id).url)}
                            disabled={isProcessing}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-positive px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-positive/90 disabled:opacity-50"
                        >
                            <CheckCircle className="size-4" />
                            Setujui
                        </button>
                        <button
                            type="button"
                            onClick={() => decide(reject(item.id).url)}
                            disabled={isProcessing}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
                        >
                            <XCircle className="size-4" />
                            Tolak
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
