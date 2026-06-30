import { Clock, Eye, NotebookPen, Wrench } from 'lucide-react';
import { useState } from 'react';
import { index } from '@/actions/App/Http/Controllers/JournalMonitorController';
import { PerformanceSummary } from '@/components/performance-summary';
import type { Performance } from '@/components/performance-summary';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Modal } from '@/components/ui/modal';
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
    const [selectedRecord, setSelectedRecord] = useState<JournalRecord | null>(
        null,
    );

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
                                <RecordCard
                                    key={record.id}
                                    record={record}
                                    onShowDetail={setSelectedRecord}
                                />
                            ))}
                        </div>
                    )}

                    <Pagination meta={records} />
                </section>
            </div>

            <Modal
                open={!!selectedRecord}
                onClose={() => setSelectedRecord(null)}
                title="Detail Jurnal"
            >
                {selectedRecord && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-ink">
                                {selectedRecord.judul}
                            </h3>
                            <p className="mt-1 text-xs text-muted">
                                {selectedRecord.dateLabel}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 border-y border-line py-2 text-xs text-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                {selectedRecord.start_time} –{' '}
                                {selectedRecord.end_time}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Wrench className="size-3.5" />
                                {selectedRecord.tools}
                            </span>
                        </div>

                        {selectedRecord.image && (
                            <div className="mt-3">
                                <img
                                    src={selectedRecord.image}
                                    alt={`Foto kegiatan ${selectedRecord.judul}`}
                                    className="aspect-video w-full rounded-xl border border-line object-cover"
                                />
                            </div>
                        )}

                        <div className="mt-3 max-h-[35vh] overflow-y-auto pr-1 text-sm text-ink/90">
                            <RichText html={selectedRecord.description} />
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedRecord(null)}
                                className="rounded-xl bg-canvas px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-line"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}

function RecordCard({
    record,
    onShowDetail,
}: {
    record: JournalRecord;
    onShowDetail: (record: JournalRecord) => void;
}) {
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

            <div className="mt-3 flex items-center border-t border-line pt-3">
                <button
                    type="button"
                    onClick={() => onShowDetail(record)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink/75 transition-colors hover:bg-canvas"
                >
                    <Eye className="size-4" />
                    Detail
                </button>
            </div>
        </article>
    );
}
