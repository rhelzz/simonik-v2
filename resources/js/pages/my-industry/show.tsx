import { Link } from '@inertiajs/react';
import {
    Building2,
    ClipboardCheck,
    Fingerprint,
    MapPin,
    NotebookPen,
    Pencil,
    UsersRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { show as assessmentShow } from '@/actions/App/Http/Controllers/AssessmentController';
import { show as attendanceShow } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { show as journalShow } from '@/actions/App/Http/Controllers/JournalMonitorController';
import { edit } from '@/actions/App/Http/Controllers/MyIndustryController';
import { statusLabels, statusStyles } from '@/components/dashboard/widgets';
import type { StatusPkl } from '@/components/dashboard/widgets';
import { MapViewer } from '@/components/map-viewer';
import type { Performance } from '@/components/performance-summary';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Industry = {
    id: number;
    name: string;
    bidang: string;
    alamat: string;
    longitude: string;
    latitude: string;
    radius: number;
    duration: string | null;
    guru: string | null;
};

type RosterRow = {
    id: number;
    name: string;
    nis: string;
    class: string | null;
    status_pkl: StatusPkl;
    performance: Performance;
};

type Props = {
    industry: Industry | null;
    roster: RosterRow[];
};

export default function MyIndustryShow({ industry, roster }: Props) {
    if (industry === null) {
        return (
            <AppLayout title="Industri Saya">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-16 text-center">
                        <Building2 className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada industri
                        </p>
                        <p className="max-w-sm text-sm text-muted">
                            Anda belum ditugaskan sebagai pembimbing di industri
                            manapun. Hubungi admin untuk penempatan.
                        </p>
                    </div>
                </section>
            </AppLayout>
        );
    }

    const hasGeo = industry.latitude !== '' && industry.longitude !== '';

    return (
        <AppLayout title="Industri Saya">
            <div className="space-y-5">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                                <Building2 className="size-6" />
                            </span>
                            <div>
                                <h2 className="text-lg font-bold text-ink">
                                    {industry.name}
                                </h2>
                                <p className="text-sm text-muted">
                                    {industry.bidang}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={edit.url()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                        >
                            <Pencil className="size-4" />
                            Edit profil
                        </Link>
                    </div>

                    <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Detail label="Alamat">{industry.alamat}</Detail>
                        <Detail label="Durasi PKL">
                            {industry.duration ?? '—'}
                        </Detail>
                        <Detail label="Guru pembimbing">
                            {industry.guru ?? '—'}
                        </Detail>
                        <Detail label="Lokasi">
                            {hasGeo ? (
                                <a
                                    href={`https://www.google.com/maps?q=${industry.latitude},${industry.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                                >
                                    <MapPin className="size-4" />
                                    {industry.latitude}, {industry.longitude} ({industry.radius}m)
                                </a>
                            ) : (
                                '—'
                            )}
                        </Detail>
                    </dl>
                    {hasGeo && (
                        <div className="mt-6">
                            <MapViewer
                                latitude={industry.latitude}
                                longitude={industry.longitude}
                                radius={industry.radius}
                            />
                        </div>
                    )}
                </section>

                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-base font-bold text-ink">
                        Anak magang
                    </h3>
                    <p className="text-sm text-muted">
                        {roster.length} siswa PKL di industri ini
                    </p>

                    {roster.length === 0 ? (
                        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                            <UsersRound className="size-8 text-muted" />
                            <p className="text-sm font-medium text-ink">
                                Belum ada anak magang
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {roster.map((student) => (
                                <RosterCard
                                    key={student.id}
                                    student={student}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-wide text-muted uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-sm text-ink">{children}</dd>
        </div>
    );
}

function RosterCard({ student }: { student: RosterRow }) {
    const { performance: p } = student;

    return (
        <div className="rounded-2xl border border-line bg-canvas/30 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="font-semibold text-ink">{student.name}</p>
                    <p className="text-xs text-muted">
                        NIS {student.nis}
                        {student.class ? ` · ${student.class}` : ''}
                    </p>
                </div>
                <span
                    className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                        statusStyles[student.status_pkl],
                    )}
                >
                    {statusLabels[student.status_pkl]}
                </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <Metric
                    icon={Fingerprint}
                    label="Kehadiran"
                    value={`${p.attendanceRate}%`}
                />
                <Metric
                    icon={NotebookPen}
                    label="Jurnal"
                    value={`${p.journalRate}%`}
                />
                <Metric
                    icon={ClipboardCheck}
                    label="Nilai"
                    value={p.avg === null ? '—' : `${p.avg} (${p.grade})`}
                />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3 text-sm font-semibold">
                <Link
                    href={attendanceShow.url(student.id)}
                    className="rounded-lg px-3 py-1.5 text-primary transition-colors hover:bg-canvas"
                >
                    Lihat absen
                </Link>
                <Link
                    href={journalShow.url(student.id)}
                    className="rounded-lg px-3 py-1.5 text-primary transition-colors hover:bg-canvas"
                >
                    Lihat jurnal
                </Link>
                <Link
                    href={assessmentShow.url(student.id)}
                    className="rounded-lg px-3 py-1.5 text-primary transition-colors hover:bg-canvas"
                >
                    Input nilai
                </Link>
            </div>
        </div>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Fingerprint;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-surface p-2.5">
            <Icon className="mx-auto size-4 text-muted" />
            <p className="mt-1 text-sm font-bold text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
        </div>
    );
}
