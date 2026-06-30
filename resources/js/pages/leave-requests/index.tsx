import { useForm } from '@inertiajs/react';
import { Calendar, FileText, LoaderCircle, CalendarOff } from 'lucide-react';
import type { FormEvent } from 'react';
import { store } from '@/actions/App/Http/Controllers/LeaveRequestController';
import { ApprovalStatus } from '@/components/approval-status';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type LeaveRequest = {
    id: number;
    date: string;
    dateLabel: string;
    reason: string;
    approval: {
        id: number;
        status: 'pending' | 'approved' | 'rejected';
        approver_role: string | null;
        approver: { name: string } | null;
        note: string | null;
    } | null;
};

type Props = {
    leaveRequests: Paginated<LeaveRequest>;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export default function LeaveRequestsIndex({ leaveRequests }: Props) {
    const form = useForm({
        date: '',
        reason: '',
    });

    function onSubmit(event: FormEvent) {
        event.preventDefault();
        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
        });
    }

    return (
        <AppLayout title="Pengajuan Libur">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Form Pengajuan */}
                <div className="lg:col-span-1">
                    <section className="rounded-3xl border border-line/40 bg-surface p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-2.5 border-b border-line pb-4">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                <Calendar className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-ink">
                                    Ajukan Libur Magang
                                </h2>
                                <p className="text-xs text-muted">
                                    Isi tanggal dan alasan libur
                                </p>
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="date"
                                    className="text-xs font-semibold text-ink/80"
                                >
                                    Tanggal Libur
                                </label>
                                <input
                                    id="date"
                                    type="date"
                                    value={form.data.date}
                                    onChange={(e) =>
                                        form.setData('date', e.target.value)
                                    }
                                    className={inputClass}
                                />
                                {form.errors.date && (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        {form.errors.date}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="reason"
                                    className="text-xs font-semibold text-ink/80"
                                >
                                    Alasan Pengajuan
                                </label>
                                <textarea
                                    id="reason"
                                    rows={4}
                                    placeholder="Jelaskan alasan pengajuan libur magang (mis. ada urusan keluarga, sakit keras, dll.)"
                                    value={form.data.reason}
                                    onChange={(e) =>
                                        form.setData('reason', e.target.value)
                                    }
                                    className={inputClass}
                                />
                                {form.errors.reason && (
                                    <p className="mt-1 text-xs font-medium text-red-500">
                                        {form.errors.reason}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
                            >
                                {form.processing && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Kirim Pengajuan
                            </button>
                        </form>
                    </section>
                </div>

                {/* Riwayat Pengajuan */}
                <div className="lg:col-span-2">
                    <section className="flex h-full flex-col rounded-3xl border border-line/40 bg-surface p-5 shadow-sm sm:p-6">
                        <div className="mb-5">
                            <h2 className="text-base font-bold text-ink">
                                Riwayat Pengajuan Libur
                            </h2>
                            <p className="text-sm text-muted">
                                {leaveRequests.total} pengajuan tercatat
                            </p>
                        </div>

                        {leaveRequests.data.length === 0 ? (
                            <div className="my-auto flex flex-col items-center justify-center gap-2 py-16 text-center">
                                <div className="mb-2 rounded-full bg-canvas p-4 text-muted">
                                    <CalendarOff className="size-8" />
                                </div>
                                <p className="text-sm font-semibold text-ink">
                                    Belum ada pengajuan libur
                                </p>
                                <p className="max-w-xs text-xs text-muted">
                                    Daftar pengajuan hari libur magang Anda akan
                                    ditampilkan di sini.
                                </p>
                            </div>
                        ) : (
                            <div className="mb-4 flex-1 space-y-4">
                                {leaveRequests.data.map((request) => (
                                    <div
                                        key={request.id}
                                        className="flex flex-col justify-between gap-4 rounded-2xl border border-line bg-canvas/10 p-4 transition-all hover:bg-canvas/20 md:flex-row md:items-start"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 text-primary">
                                                <Calendar className="size-4 shrink-0" />
                                                <span className="text-sm font-semibold">
                                                    {request.dateLabel}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2 rounded-xl border border-line/50 bg-surface p-3 text-sm text-ink/90">
                                                <FileText className="mt-0.5 size-4 shrink-0 text-muted" />
                                                <p className="leading-relaxed whitespace-pre-line">
                                                    {request.reason}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="shrink-0 border-t border-line pt-3 md:w-64 md:border-t-0 md:border-l md:pt-0 md:pl-4">
                                            <span className="mb-1 block text-xs text-muted">
                                                Status Approval:
                                            </span>
                                            {request.approval ? (
                                                <ApprovalStatus
                                                    approval={request.approval}
                                                    canAct={false}
                                                />
                                            ) : (
                                                <span className="text-xs font-semibold text-muted">
                                                    Tidak ada data approval
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-auto border-t border-line pt-4">
                            <Pagination meta={leaveRequests} />
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
