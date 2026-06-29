import { Link } from '@inertiajs/react';
import { CalendarCheck, NotebookPen, UsersRound } from 'lucide-react';
import { show as assessmentShow } from '@/actions/App/Http/Controllers/AssessmentController';
import { show as attendanceShow } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { show as journalShow } from '@/actions/App/Http/Controllers/JournalMonitorController';
import {
    HeroGreeting,
    statusLabels,
    statusStyles,
} from '@/components/dashboard/widgets';
import type { StatusPkl } from '@/components/dashboard/widgets';
import { AppLayout } from '@/layouts/app-layout';
import { gradeStyles } from '@/lib/grade';
import type { Grade } from '@/lib/grade';
import { cn } from '@/lib/utils';

type Child = {
    id: number;
    name: string;
    nis: string;
    class: string | null;
    industry: string | null;
    status_pkl: StatusPkl;
    attendanceMonth: number;
    journalMonth: number;
    grade: Grade | null;
};

export default function DashboardParent({
    children,
    today,
}: {
    children: Child[];
    today: string;
}) {
    return (
        <AppLayout title="Dashboard">
            <HeroGreeting today={today} fallbackName="Orang Tua">
                {children.length > 0
                    ? `Pantau perkembangan PKL ${children.length === 1 ? 'anak' : `${children.length} anak`} Anda di sini.`
                    : 'Belum ada data anak yang terhubung dengan akun Anda.'}
            </HeroGreeting>

            {children.length === 0 ? (
                <section className="mt-5 flex flex-col items-center gap-2 rounded-3xl bg-surface py-16 text-center">
                    <UsersRound className="size-8 text-muted" />
                    <p className="text-sm font-medium text-ink">
                        Tidak ada anak terdaftar
                    </p>
                    <p className="text-xs text-muted">
                        Hubungi admin untuk menautkan data anak Anda.
                    </p>
                </section>
            ) : (
                <section className="mt-5 grid gap-4 lg:grid-cols-2">
                    {children.map((child) => (
                        <article
                            key={child.id}
                            className="rounded-3xl bg-surface p-5 sm:p-6"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-ink">
                                        {child.name}
                                    </h3>
                                    <p className="text-xs text-muted">
                                        NIS {child.nis}
                                        {child.class ? ` · ${child.class}` : ''}
                                    </p>
                                </div>
                                <span
                                    className={cn(
                                        'inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                                        statusStyles[child.status_pkl],
                                    )}
                                >
                                    {statusLabels[child.status_pkl]}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-muted">
                                {child.industry ?? 'Belum ditempatkan'}
                            </p>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <Metric
                                    icon={CalendarCheck}
                                    label="Hadir / bln"
                                    value={child.attendanceMonth}
                                />
                                <Metric
                                    icon={NotebookPen}
                                    label="Jurnal / bln"
                                    value={child.journalMonth}
                                />
                                <div className="rounded-2xl border border-line bg-canvas/40 p-3 text-center">
                                    <p className="text-xs text-muted">Nilai</p>
                                    {child.grade ? (
                                        <span
                                            className={cn(
                                                'mt-1 inline-flex rounded-full px-2.5 py-0.5 text-sm font-bold',
                                                gradeStyles[child.grade],
                                            )}
                                        >
                                            {child.grade}
                                        </span>
                                    ) : (
                                        <p className="mt-1 text-sm font-semibold text-muted">
                                            —
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4 text-sm font-semibold">
                                <Link
                                    href={attendanceShow.url(child.id)}
                                    className="rounded-lg px-3 py-1.5 text-primary transition-colors hover:bg-canvas"
                                >
                                    Lihat absen
                                </Link>
                                <Link
                                    href={journalShow.url(child.id)}
                                    className="rounded-lg px-3 py-1.5 text-primary transition-colors hover:bg-canvas"
                                >
                                    Lihat jurnal
                                </Link>
                                <Link
                                    href={assessmentShow.url(child.id)}
                                    className="rounded-lg px-3 py-1.5 text-primary transition-colors hover:bg-canvas"
                                >
                                    Lihat nilai
                                </Link>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </AppLayout>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof CalendarCheck;
    label: string;
    value: number;
}) {
    return (
        <div className="rounded-2xl border border-line bg-canvas/40 p-3 text-center">
            <Icon className="mx-auto size-4 text-muted" />
            <p className="mt-1 text-lg font-bold text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
        </div>
    );
}
