import { useForm } from '@inertiajs/react';
import { FileText, LoaderCircle, HeartPulse, FileImage, ShieldAlert, ArrowRight } from 'lucide-react';
import type { FormEvent } from 'react';
import { store } from '@/actions/App/Http/Controllers/SakitIzinController';
import { ApprovalStatus } from '@/components/approval-status';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ApprovalData = {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    approver_role: string | null;
    approver: { name: string } | null;
    note: string | null;
};

type SakitIzin = {
    id: number;
    date: string;
    dateLabel: string;
    type: 'sakit' | 'izin';
    typeLabel: string;
    reason: string;
    bukti: string | null;
    approvals: ApprovalData[];
};

type Props = {
    sakitIzins: Paginated<SakitIzin>;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export default function SakitIzinIndex({ sakitIzins }: Props) {
    const form = useForm({
        date: '',
        type: 'sakit',
        reason: '',
        bukti: null as File | null,
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
        <AppLayout title="Sakit & Izin">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Form Pengajuan */}
                <div className="lg:col-span-1">
                    <section className="rounded-3xl bg-surface p-5 sm:p-6 shadow-sm border border-line/40">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-line mb-5">
                            <div className="rounded-lg bg-primary/10 p-2 text-primary">
                                <HeartPulse className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-ink">
                                    Ajukan Sakit / Izin
                                </h2>
                                <p className="text-xs text-muted">
                                    Isi data dan unggah bukti surat
                                </p>
                            </div>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-4" encType="multipart/form-type">
                            <div className="space-y-1.5">
                                <label
                                    htmlFor="type"
                                    className="text-xs font-semibold text-ink/80"
                                >
                                    Jenis Pengajuan
                                </label>
                                <select
                                    id="type"
                                    value={form.data.type}
                                    onChange={(e) =>
                                        form.setData('type', e.target.value as 'sakit' | 'izin')
                                    }
                                    className={inputClass}
                                >
                                    <option value="sakit">Sakit</option>
                                    <option value="izin">Izin</option>
                                </select>
                                {form.errors.type && (
                                    <p className="text-xs font-medium text-red-500 mt-1">
                                        {form.errors.type}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="date"
                                    className="text-xs font-semibold text-ink/80"
                                >
                                    Tanggal
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
                                    <p className="text-xs font-medium text-red-500 mt-1">
                                        {form.errors.date}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="reason"
                                    className="text-xs font-semibold text-ink/80"
                                >
                                    Keterangan / Alasan
                                </label>
                                <textarea
                                    id="reason"
                                    rows={3}
                                    placeholder="Jelaskan alasan detail ketidakhadiran Anda..."
                                    value={form.data.reason}
                                    onChange={(e) =>
                                        form.setData('reason', e.target.value)
                                    }
                                    className={inputClass}
                                />
                                {form.errors.reason && (
                                    <p className="text-xs font-medium text-red-500 mt-1">
                                        {form.errors.reason}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="bukti"
                                    className="text-xs font-semibold text-ink/80"
                                >
                                    Unggah Bukti (Foto/Surat Dokter)
                                </label>
                                <input
                                    id="bukti"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        form.setData('bukti', e.target.files?.[0] || null)
                                    }
                                    className="w-full text-sm text-muted file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                <p className="text-[10px] text-muted">Maksimal 2MB. Format: JPG, PNG, GIF</p>
                                {form.errors.bukti && (
                                    <p className="text-xs font-medium text-red-500 mt-1">
                                        {form.errors.bukti}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-60"
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
                    <section className="rounded-3xl bg-surface p-5 sm:p-6 shadow-sm border border-line/40 h-full flex flex-col">
                        <div className="mb-5">
                            <h2 className="text-base font-bold text-ink">
                                Riwayat Pengajuan Sakit & Izin
                            </h2>
                            <p className="text-sm text-muted">
                                {sakitIzins.total} pengajuan tercatat
                            </p>
                        </div>

                        {sakitIzins.data.length === 0 ? (
                            <div className="my-auto py-16 flex flex-col items-center justify-center gap-2 text-center">
                                <div className="rounded-full bg-canvas p-4 text-muted mb-2">
                                    <HeartPulse className="size-8" />
                                </div>
                                <p className="text-sm font-semibold text-ink">
                                    Belum ada pengajuan sakit/izin
                                </p>
                                <p className="text-xs text-muted max-w-xs">
                                    Daftar pengajuan izin sakit atau keperluan Anda akan ditampilkan di sini.
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 space-y-4 mb-4">
                                {sakitIzins.data.map((request) => {
                                    const parentApproval = request.approvals[0] || null;
                                    const industryApproval = request.approvals[1] || null;

                                    return (
                                        <div
                                            key={request.id}
                                            className="rounded-2xl border border-line bg-canvas/10 p-4 hover:bg-canvas/20 transition-all flex flex-col gap-4"
                                        >
                                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                {/* Info Pengajuan */}
                                                <div className="space-y-2 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                                request.type === 'sakit'
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'bg-warning/10 text-warning'
                                                            }`}
                                                        >
                                                            {request.typeLabel}
                                                        </span>
                                                        <span className="text-muted text-xs">·</span>
                                                        <span className="text-xs text-ink/75 font-medium">
                                                            {request.dateLabel}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start gap-2 text-ink/90 text-sm bg-surface p-3 rounded-xl border border-line/50">
                                                        <FileText className="size-4 mt-0.5 shrink-0 text-muted" />
                                                        <p className="whitespace-pre-line leading-relaxed">
                                                            {request.reason}
                                                        </p>
                                                    </div>

                                                    {request.bukti && (
                                                        <a
                                                            href={request.bukti}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline bg-primary/5 px-2.5 py-1.5 rounded-lg border border-primary/10"
                                                        >
                                                            <FileImage className="size-3.5" />
                                                            Lihat Bukti Lampiran
                                                        </a>
                                                    )}
                                                </div>

                                                {/* Step-by-Step Approval Panel */}
                                                <div className="md:w-72 shrink-0 border-t md:border-t-0 md:border-l border-line pt-3 md:pt-0 md:pl-4 space-y-4">
                                                    {/* Tahap 1: Ortu */}
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-bold text-ink/80 flex items-center gap-1">
                                                            Tahap 1: Orang Tua
                                                        </span>
                                                        {parentApproval ? (
                                                            <ApprovalStatus
                                                                approval={parentApproval}
                                                                canAct={false}
                                                            />
                                                        ) : (
                                                            <span className="text-xs text-muted font-medium">
                                                                Menunggu data
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-center md:justify-start">
                                                        <ArrowRight className="size-4 text-muted rotate-90 md:rotate-0" />
                                                    </div>

                                                    {/* Tahap 2: Industri/Guru */}
                                                    <div className="space-y-1">
                                                        <span className="text-xs font-bold text-ink/80 flex items-center gap-1">
                                                            Tahap 2: Industri / Guru
                                                        </span>
                                                        {industryApproval ? (
                                                            <ApprovalStatus
                                                                approval={industryApproval}
                                                                canAct={false}
                                                            />
                                                        ) : parentApproval?.status === 'rejected' ? (
                                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 text-red-500 px-3 py-1 text-xs font-medium">
                                                                <ShieldAlert className="size-3.5" />
                                                                Gagal (Ditolak Ortu)
                                                            </div>
                                                        ) : parentApproval?.status === 'approved' ? (
                                                            <div className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 text-warning px-3 py-1 text-xs font-medium animate-pulse">
                                                                Menunggu Industri
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-muted font-medium">
                                                                Menunggu Tahap 1
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-line">
                            <Pagination meta={sakitIzins} />
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
