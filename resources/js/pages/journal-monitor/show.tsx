import { Clock, NotebookPen, Wrench } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/JournalMonitorController';
import { PerformanceSummary } from '@/components/performance-summary';
import type { Performance } from '@/components/performance-summary';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { RichText } from '@/components/ui/rich-text';
import { AppLayout } from '@/layouts/app-layout';
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
    performance: Performance;
};

export default function JournalMonitorShow({
    student,
    records,
    performance,
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

                    <div className="mt-4">
                        <h2 className="text-lg font-bold text-ink">
                            {student.name}
                        </h2>
                        <p className="text-sm text-muted">
                            NIS {student.nis}
                            {student.class ? ` · ${student.class}` : ''}
                            {student.industry ? ` · ${student.industry}` : ''}
                        </p>
                    </div>
                </section>

                <PerformanceSummary performance={performance} />

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
                                <RecordCard key={record.id} record={record} />
                            ))}
                        </div>
                    )}

                    <Pagination meta={records} />
                </section>
            </div>
        </AppLayout>
    );
}

function RecordCard({ record }: { record: JournalRecord }) {
    return (
        <article className="rounded-2xl border border-line bg-canvas/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <h4 className="font-semibold text-ink">{record.judul}</h4>
                    <p className="text-xs text-muted">{record.dateLabel}</p>
                </div>
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
        </article>
    );
}
