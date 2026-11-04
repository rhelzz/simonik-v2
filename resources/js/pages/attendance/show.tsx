import { Link } from '@inertiajs/react';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/AttendanceController';
import { ApprovalStatus } from '@/components/approval-status';
import type { EmotionKey } from '@/components/photo-capture';
import { EMOTION_INFO } from '@/components/photo-capture';
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
        isLate?: boolean;
        lateMinutes?: number | null;
        absenceReason: string | null;
        image: string | null;
        emotion: EmotionKey | null;
        departureImage: string | null;
        departureEmotion: EmotionKey | null;
        latitude: string | null;
        longitude: string | null;
        description: string | null;
        mode: string | null;
        approval: {
            id: number;
            status: 'pending' | 'approved' | 'rejected';
            approver_role: string | null;
            note: string | null;
        } | null;
    };
    student?: {
        name: string;
        class: string | null;
        industry: string | null;
    } | null;
};

function EmotionBadge({ emotion }: { emotion: EmotionKey }) {
    const info = EMOTION_INFO[emotion];

    return (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
            <span aria-hidden>{info.emoji}</span>
            <span>{info.label}</span>
        </div>
    );
}

function DetailItem({
    label,
    value,
    children,
}: {
    label: string;
    value?: string | null | undefined;
    children?: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
            </p>
            {children ? (
                <div className="text-sm text-ink">{children}</div>
            ) : (
                <p className="text-sm text-ink">{value || '—'}</p>
            )}
        </div>
    );
}

function getAttendanceStatus(
    attendance: AttendanceShowProps['attendance'],
): string {
    const raw = (attendance.status ?? '').toLowerCase();

    if (raw === 'hadir' || raw === 'masuk') {
        if (
            attendance.isLate ||
            (attendance.lateMinutes !== null &&
                attendance.lateMinutes !== undefined &&
                attendance.lateMinutes > 0)
        ) {
            return 'terlambat';
        }

        if (!attendance.departureTime) {
            return 'belum-lengkap';
        }
    }

    return attendance.status ?? '';
}

export default function AttendanceShow({
    attendance,
    student,
}: AttendanceShowProps) {
    const status = getAttendanceStatus(attendance);
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
                                attendanceStyle(status),
                            )}
                        >
                            {attendanceLabel(status)}
                        </span>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem label="Nama" value={student?.name} />
                        <DetailItem label="Kelas" value={student?.class} />
                        <DetailItem
                            label="Industri"
                            value={student?.industry}
                        />
                        <DetailItem label="Status">
                            <span
                                className={cn(
                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                    attendanceStyle(status),
                                )}
                            >
                                {attendanceLabel(status)}
                            </span>
                        </DetailItem>
                        <DetailItem
                            label="Jam Masuk"
                            value={attendance.arrivalTime}
                        />
                        <DetailItem
                            label="Jam Pulang"
                            value={attendance.departureTime}
                        />
                        <DetailItem label="Keterlambatan">
                            {attendance.lateMinutes !== null &&
                            attendance.lateMinutes !== undefined ? (
                                attendance.lateMinutes > 0 ? (
                                    <span className="inline-flex rounded bg-orange-500/15 px-2 py-0.5 text-xs font-semibold text-orange-600">
                                        {attendance.lateMinutes} menit terlambat
                                    </span>
                                ) : (
                                    <span className="text-muted">
                                        Tepat waktu
                                    </span>
                                )
                            ) : (
                                '—'
                            )}
                        </DetailItem>
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
                        <DetailItem
                            label="Mode Presensi"
                            value={
                                attendance.mode
                                    ? attendance.mode.toUpperCase()
                                    : 'WFO'
                            }
                        />
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

                {/* WFA Approval */}
                {attendance.mode === 'wfa' && attendance.approval && (
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <h2 className="mb-4 text-base font-bold text-ink">
                            Persetujuan Mode WFA
                        </h2>
                        <ApprovalStatus
                            approval={attendance.approval}
                            canAct={false}
                        />
                    </section>
                )}

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
                                <div className="relative">
                                    <img
                                        src={attendance.image}
                                        alt="Foto absen masuk"
                                        className="aspect-4/3 w-full rounded-2xl border border-line object-cover"
                                    />
                                    {attendance.emotion && (
                                        <EmotionBadge
                                            emotion={attendance.emotion}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                                    Foto Pulang
                                </p>
                                {attendance.departureImage ? (
                                    <div className="relative">
                                        <img
                                            src={attendance.departureImage}
                                            alt="Foto absen pulang"
                                            className="aspect-4/3 w-full rounded-2xl border border-line object-cover"
                                        />
                                        {attendance.departureEmotion && (
                                            <EmotionBadge
                                                emotion={
                                                    attendance.departureEmotion
                                                }
                                            />
                                        )}
                                    </div>
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
