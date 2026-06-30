import { Link } from '@inertiajs/react';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/AttendanceController';
import { AppLayout } from '@/layouts/app-layout';
import { attendanceLabel, attendanceStyle } from '@/lib/attendance';
import { cn } from '@/lib/utils';

type AttendanceShowProps = {
    attendance: {
        id: number;
        date: string;
        dateLabel: string;
        status: string | null;
        arrivalTime: string | null;
        departureTime: string | null;
        absenceReason: string | null;
        image: string | null;
        departureImage: string | null;
        latitude: string | null;
        longitude: string | null;
        description: string | null;
    };
};

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
            </p>
            <p className="text-sm text-ink">{value || '—'}</p>
        </div>
    );
}

export default function AttendanceShow({ attendance }: AttendanceShowProps) {
    const mapsUrl =
        attendance.latitude && attendance.longitude
            ? `https://www.google.com/maps?q=${attendance.latitude},${attendance.longitude}`
            : null;

    return (
        <AppLayout title={`Detail Absen – ${attendance.dateLabel}`}>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center">
                    <Link
                        href={index.url()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali
                    </Link>
                </div>

                {/* Info Absen */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base font-bold text-ink">
                            {attendance.dateLabel}
                        </h2>
                        <span
                            className={cn(
                                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                                attendanceStyle(attendance.status),
                            )}
                        >
                            {attendanceLabel(attendance.status)}
                        </span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem
                            label="Jam Masuk"
                            value={attendance.arrivalTime}
                        />
                        <DetailItem
                            label="Jam Pulang"
                            value={attendance.departureTime}
                        />
                        {attendance.absenceReason && (
                            <DetailItem
                                label="Alasan"
                                value={attendance.absenceReason}
                            />
                        )}
                        {attendance.description && (
                            <DetailItem
                                label="Keterangan"
                                value={attendance.description}
                            />
                        )}
                    </div>

                    {mapsUrl && (
                        <div className="mt-5">
                            <p className="mb-1.5 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Lokasi
                            </p>
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                            >
                                <MapPin className="size-4" />
                                {Number(attendance.latitude).toFixed(5)},{' '}
                                {Number(attendance.longitude).toFixed(5)}
                            </a>
                        </div>
                    )}
                </section>

                {/* Foto */}
                {attendance.image && (
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <h2 className="mb-4 text-base font-bold text-ink">
                            Foto Absen
                        </h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                                    Foto Masuk
                                </p>
                                <img
                                    src={attendance.image}
                                    alt="Foto absen masuk"
                                    className="aspect-4/3 w-full rounded-2xl border border-line object-cover"
                                />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                                    Foto Pulang
                                </p>
                                {attendance.departureImage ? (
                                    <img
                                        src={attendance.departureImage}
                                        alt="Foto absen pulang"
                                        className="aspect-4/3 w-full rounded-2xl border border-line object-cover"
                                    />
                                ) : (
                                    <div className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-muted">
                                        <Clock className="size-5" />
                                        <p className="text-xs font-medium">
                                            Belum absen pulang
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
