import { router } from '@inertiajs/react';
import {
    CalendarCheck,
    LoaderCircle,
    LogIn,
    LogOut,
    MapPin,
    ShieldCheck,
    ShieldX,
} from 'lucide-react';
import { useState } from 'react';
import {
    index,
    verify,
} from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import { attendanceLabel, attendanceStyle } from '@/lib/attendance';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type AttendanceRecord = {
    id: number;
    date: string;
    dateLabel: string;
    status: string | null;
    arrivalTime: string | null;
    departureTime: string | null;
    absenceReason: string | null;
    image: string | null;
    latitude: string | null;
    longitude: string | null;
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
    records: Paginated<AttendanceRecord>;
    summary: { hadir: number; izin: number; sakit: number; alpha: number };
    canVerify: boolean;
};

export default function AttendanceMonitorShow({
    student,
    records,
    summary,
    canVerify,
}: Props) {
    return (
        <AppLayout title="Data Absen">
            <div className="space-y-5">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <Breadcrumb
                        items={[
                            { label: 'Data Absen', href: index.url() },
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
                            <SummaryChip label="Hadir" value={summary.hadir} />
                            <SummaryChip label="Izin" value={summary.izin} />
                            <SummaryChip label="Sakit" value={summary.sakit} />
                            <SummaryChip label="Alpha" value={summary.alpha} />
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-base font-bold text-ink">
                        Riwayat absen
                    </h3>
                    <p className="text-sm text-muted">
                        {records.total} catatan kehadiran
                    </p>

                    {records.data.length === 0 ? (
                        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                            <CalendarCheck className="size-8 text-muted" />
                            <p className="text-sm font-medium text-ink">
                                Belum ada catatan absen
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
    record: AttendanceRecord;
    canVerify: boolean;
}) {
    const hasGeo = record.latitude !== null && record.longitude !== null;

    return (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-canvas/30 p-4 sm:flex-row">
            {record.image ? (
                <img
                    src={record.image}
                    alt={`Foto absen ${record.dateLabel}`}
                    className="aspect-[4/3] w-full rounded-xl border border-line object-cover sm:w-40"
                />
            ) : (
                <div className="grid aspect-[4/3] w-full place-items-center rounded-xl border border-dashed border-line text-muted sm:w-40">
                    <CalendarCheck className="size-7" />
                </div>
            )}

            <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{record.dateLabel}</p>
                    <span
                        className={cn(
                            'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                            attendanceStyle(record.status),
                        )}
                    >
                        {attendanceLabel(record.status)}
                    </span>
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/80">
                    {record.arrivalTime && (
                        <span className="inline-flex items-center gap-1.5">
                            <LogIn className="size-4 text-muted" />
                            Masuk {record.arrivalTime}
                        </span>
                    )}
                    {record.departureTime && (
                        <span className="inline-flex items-center gap-1.5">
                            <LogOut className="size-4 text-muted" />
                            Pulang {record.departureTime}
                        </span>
                    )}
                    {hasGeo && (
                        <a
                            href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                        >
                            <MapPin className="size-4" />
                            Lihat lokasi
                        </a>
                    )}
                </div>

                {record.absenceReason && (
                    <p className="text-sm text-ink/70">
                        Alasan: {record.absenceReason}
                    </p>
                )}

                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
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

                    {canVerify && <VerifyButton record={record} />}
                </div>
            </div>
        </div>
    );
}

function VerifyButton({ record }: { record: AttendanceRecord }) {
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
