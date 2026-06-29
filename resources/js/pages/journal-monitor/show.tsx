import { router } from '@inertiajs/react';
import {
    Clock,
    LoaderCircle,
    NotebookPen,
    ShieldCheck,
    ShieldX,
    Wrench,
} from 'lucide-react';
import { useState } from 'react';
import {
    index,
    verify,
} from '@/actions/App/Http/Controllers/JournalMonitorController';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { RichText } from '@/components/ui/rich-text';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type JournalRecord = {
    id: number;
    judul: string;
    date: string;
    dateLabel: string;
    start_time: string;
    end_time: string;
    description: string;
    tools: string;
    image: string | null;
    verified: boolean;
};

type Props = {
    student: {
        id: number;
        name: string;
        nis: string;
        class: string | null;
        industry: string | null;
    };
    records: Paginated<JournalRecord>;
    summary: { total: number; verified: number; pending: number };
    canVerify: boolean;
};

export default function JournalMonitorShow({
    student,
    records,
    summary,
    canVerify,
}: Props) {
    return (
        <AppLayout title="Data Jurnal">
            <div className="space-y-5">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <Breadcrumb
                        items={[
                            { label: 'Data Jurnal', href: index.url() },
                            { label: student.name },
                        ]}
                    />

                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-ink">
                                {student.name}
                            </h2>
                            <p className="text-sm text-muted">
                                NIS {student.nis}
                                {student.class ? ` · ${student.class}` : ''}
                                {student.industry
                                    ? ` · ${student.industry}`
                                    : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <SummaryChip label="Total" value={summary.total} />
                            <SummaryChip
                                label="Terverifikasi"
                                value={summary.verified}
                            />
                            <SummaryChip
                                label="Menunggu"
                                value={summary.pending}
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-base font-bold text-ink">
                        Jurnal kegiatan
                    </h3>
                    <p className="text-sm text-muted">
                        {records.total} jurnal tercatat
                    </p>

                    {records.data.length === 0 ? (
                        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                            <NotebookPen className="size-8 text-muted" />
                            <p className="text-sm font-medium text-ink">
                                Belum ada jurnal
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {records.data.map((record) => (
                                <RecordCard
                                    key={record.id}
                                    record={record}
                                    canVerify={canVerify}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination meta={records} />
                </section>
            </div>
        </AppLayout>
    );
}

function SummaryChip({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-2xl border border-line bg-canvas/40 px-4 py-2 text-center">
            <p className="text-lg font-bold text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
        </div>
    );
}

function RecordCard({
    record,
    canVerify,
}: {
    record: JournalRecord;
    canVerify: boolean;
}) {
    return (
        <article className="rounded-2xl border border-line bg-canvas/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h4 className="font-semibold text-ink">{record.judul}</h4>
                    <p className="text-xs text-muted">{record.dateLabel}</p>
                </div>
                {record.verified ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-positive">
                        <ShieldCheck className="size-4" />
                        Terverifikasi
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted">
                        <ShieldX className="size-4" />
                        Belum diverifikasi
                    </span>
                )}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {record.start_time} – {record.end_time}
                </span>
                <span className="inline-flex items-center gap-1.5">
                    <Wrench className="size-3.5" />
                    {record.tools}
                </span>
            </div>

            {record.image && (
                <img
                    src={record.image}
                    alt={`Foto kegiatan ${record.judul}`}
                    className="mt-3 aspect-video w-full max-w-sm rounded-xl border border-line object-cover"
                />
            )}

            <RichText html={record.description} className="mt-3" />

            {canVerify && (
                <div className="mt-3 border-t border-line pt-3">
                    <VerifyButton record={record} />
                </div>
            )}
        </article>
    );
}

function VerifyButton({ record }: { record: JournalRecord }) {
    const [processing, setProcessing] = useState(false);

    function submit() {
        router.patch(
            verify.url(record.id),
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <button
            type="button"
            onClick={submit}
            disabled={processing}
            className={cn(
                'inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-60',
                record.verified
                    ? 'border border-line text-ink hover:bg-canvas'
                    : 'bg-primary text-white hover:bg-primary-hover',
            )}
        >
            {processing ? (
                <LoaderCircle className="size-4 animate-spin" />
            ) : record.verified ? (
                <ShieldX className="size-4" />
            ) : (
                <ShieldCheck className="size-4" />
            )}
            {record.verified ? 'Batalkan' : 'Verifikasi'}
        </button>
    );
}
