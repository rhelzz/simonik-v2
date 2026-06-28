import { Link, router } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck, MapPin, RotateCcw } from 'lucide-react';
import {
    index,
    verify,
} from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { AppLayout } from '@/layouts/app-layout';
import { statusBadgeClass, statusLabel } from '@/lib/attendance';
import { cn } from '@/lib/utils';

type MonitorAttendance = {
    id: number;
    date: string;
    status: string | null;
    arrivalTime: string | null;
    departureTime: string | null;
    absenceReason: string | null;
    description: string | null;
    image: string | null;
    latitude: string | null;
    longitude: string | null;
    verified: boolean;
    student: string | null;
    class: string | null;
    industry: string | null;
};

type MonitorShowProps = {
    attendance: MonitorAttendance;
    can: { verify: boolean };
};

export default function AttendanceMonitorShow({
    attendance,
    can,
}: MonitorShowProps) {
    function setVerified(value: boolean) {
        router.patch(
            verify.url(attendance.id),
            { verified: value },
            { preserveScroll: true },
        );
    }

    const hasGeo = attendance.latitude && attendance.longitude;
    const mapsUrl = hasGeo
        ? `https://www.google.com/maps/search/?api=1&query=${attendance.latitude},${attendance.longitude}`
        : null;

    return (
        <AppLayout title="Detail Kehadiran">
            <div className="space-y-5">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 transition-colors hover:text-primary"
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke daftar
                </Link>

                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-ink">
                                    {attendance.student ?? '—'}
                                </h2>
                                <span
                                    className={cn(
                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                        statusBadgeClass(attendance.status),
                                    )}
                                >
                                    {statusLabel(attendance.status)}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-muted">
                                {attendance.date} · {attendance.class ?? '—'}
                            </p>
                        </div>
                        {attendance.verified ? (
                            <span className="inline-flex h-fit items-center gap-1 rounded-full bg-positive/15 px-3 py-1 text-xs font-semibold text-positive">
                                <BadgeCheck className="size-3.5" />
                                Terverifikasi
                            </span>
                        ) : (
                            <span className="inline-flex h-fit rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-muted">
                                Belum diverifikasi
                            </span>
                        )}
                    </div>

                    <dl className="grid gap-4 py-4 sm:grid-cols-3">
                        <Meta
                            label="Jam masuk"
                            value={attendance.arrivalTime}
                        />
                        <Meta
                            label="Jam pulang"
                            value={attendance.departureTime}
                        />
                        <Meta label="Industri" value={attendance.industry} />
                        <Meta
                            label="Alasan (izin/sakit)"
                            value={attendance.absenceReason}
                        />
                        <Meta
                            label="Keterangan"
                            value={attendance.description}
                        />
                    </dl>

                    <div className="grid gap-5 pt-2 sm:grid-cols-2">
                        <div>
                            <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Foto absensi
                            </h3>
                            {attendance.image ? (
                                <img
                                    src={attendance.image}
                                    alt={`Foto absensi ${attendance.student ?? ''}`}
                                    className="max-h-80 rounded-2xl border border-line object-contain"
                                />
                            ) : (
                                <p className="text-sm text-muted">
                                    Tidak ada foto.
                                </p>
                            )}
                        </div>
                        <div>
                            <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Lokasi
                            </h3>
                            {hasGeo ? (
                                <div className="space-y-2">
                                    <p className="text-sm text-ink/80">
                                        {attendance.latitude},{' '}
                                        {attendance.longitude}
                                    </p>
                                    <a
                                        href={mapsUrl ?? '#'}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
                                    >
                                        <MapPin className="size-4" />
                                        Buka di Google Maps
                                    </a>
                                </div>
                            ) : (
                                <p className="text-sm text-muted">
                                    Tidak ada data lokasi.
                                </p>
                            )}
                        </div>
                    </div>

                    {can.verify && (
                        <div className="mt-5 flex justify-end border-t border-line pt-4">
                            {attendance.verified ? (
                                <button
                                    type="button"
                                    onClick={() => setVerified(false)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                                >
                                    <RotateCcw className="size-4" />
                                    Batalkan verifikasi
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setVerified(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                                >
                                    <BadgeCheck className="size-4" />
                                    Verifikasi kehadiran
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

function Meta({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">
                {value ?? '—'}
            </dd>
        </div>
    );
}
