import { Link } from '@inertiajs/react';
import {
    Award,
    CalendarCheck,
    Camera,
    ClipboardCheck,
    NotebookPen,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { index as activitiesIndex } from '@/actions/App/Http/Controllers/ActivityController';
import { index as assessmentsIndex } from '@/actions/App/Http/Controllers/AssessmentController';
import { index as attendanceIndex } from '@/actions/App/Http/Controllers/AttendanceController';
import { index as certificatesIndex } from '@/actions/App/Http/Controllers/CertificateController';
import type { BadgeData } from '@/components/badges/badge-atom';
import { BadgeShowcase } from '@/components/badges/badge-showcase';
import {
    HeroGreeting,
    StatCard,
    statusLabels,
    statusStyles,
} from '@/components/dashboard/widgets';
import type { StatusPkl } from '@/components/dashboard/widgets';
import { AppLayout } from '@/layouts/app-layout';
import { attendanceLabel, attendanceStyle } from '@/lib/attendance';
import { gradeStyles } from '@/lib/grade';
import type { Grade } from '@/lib/grade';
import { cn } from '@/lib/utils';

type DashboardStudentProps = {
    profile: {
        industry: string | null;
        status_pkl: StatusPkl | null;
        period: string | null;
    };
    todayStatus: string | null;
    stats: {
        attendanceMonth: number;
        journalMonth: number;
        journalTotal: number;
        avg: number | null;
        grade: Grade | null;
        current_streak: number;
        longest_streak: number;
    };
    badges: BadgeData[];
    today: string;
};

const actions: Array<{ label: string; icon: LucideIcon; href: string }> = [
    { label: 'Absen', icon: Camera, href: attendanceIndex.url() },
    { label: 'Jurnal', icon: NotebookPen, href: activitiesIndex.url() },
    {
        label: 'Rekap Nilai',
        icon: ClipboardCheck,
        href: assessmentsIndex.url(),
    },
    { label: 'Sertifikat', icon: Award, href: certificatesIndex.url() },
];

export default function DashboardStudent({
    profile,
    todayStatus,
    stats,
    badges,
    today,
}: DashboardStudentProps) {
    return (
        <AppLayout title="Dashboard">
            <HeroGreeting today={today} fallbackName="Siswa">
                {profile.industry
                    ? `Anda sedang PKL di ${profile.industry}. Jangan lupa absen dan isi jurnal hari ini.`
                    : 'Selamat datang. Pastikan absen dan jurnal harianmu terisi.'}
            </HeroGreeting>

            {/* Quick actions */}
            <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-surface p-5 text-center transition-colors hover:bg-primary-soft"
                    >
                        <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                            <action.icon className="size-5" />
                        </span>
                        <span className="text-sm font-semibold text-ink">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </section>

            {/* Today + grade */}
            <section className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex items-center gap-2 text-sm text-muted">
                        <CalendarCheck className="size-4" />
                        Absen hari ini
                    </div>
                    <div className="mt-3">
                        <span
                            className={cn(
                                'inline-flex rounded-full px-3 py-1.5 text-sm font-semibold',
                                attendanceStyle(todayStatus),
                            )}
                        >
                            {attendanceLabel(todayStatus)}
                        </span>
                    </div>
                    {todayStatus === null && (
                        <Link
                            href={attendanceIndex.url()}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Camera className="size-4" />
                            Absen sekarang
                        </Link>
                    )}
                </div>

                <div className="rounded-3xl bg-surface p-5 sm:p-6">
                    <p className="text-sm text-muted">Nilai rata-rata</p>
                    {stats.avg === null || stats.grade === null ? (
                        <p className="mt-3 text-sm font-medium text-muted">
                            Belum dinilai
                        </p>
                    ) : (
                        <div className="mt-2 flex items-center gap-3">
                            <p className="text-4xl font-extrabold tracking-tight text-ink">
                                {stats.avg}
                            </p>
                            <span
                                className={cn(
                                    'inline-flex rounded-full px-3 py-1 text-sm font-bold',
                                    gradeStyles[stats.grade],
                                )}
                            >
                                {stats.grade}
                            </span>
                        </div>
                    )}
                    <Link
                        href={assessmentsIndex.url()}
                        className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                        Lihat rekap nilai →
                    </Link>
                </div>
            </section>

            {/* Counters */}
            <section className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <StatCard
                    icon={CalendarCheck}
                    label="Hari hadir bulan ini"
                    value={stats.attendanceMonth}
                    tint="bg-primary-soft text-primary"
                />
                <StatCard
                    icon={NotebookPen}
                    label="Jurnal bulan ini"
                    value={stats.journalMonth}
                    tint="bg-warning/15 text-warning"
                />
                <StatCard
                    icon={NotebookPen}
                    label="Total jurnal"
                    value={stats.journalTotal}
                    tint="bg-positive/15 text-positive"
                />
            </section>

            {/* Streak */}
            <section className="mt-5 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-4 rounded-3xl bg-surface p-5 sm:p-6">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-2xl">
                        🔥
                    </span>
                    <div>
                        <p className="text-sm text-muted">Streak sekarang</p>
                        <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink">
                            {stats.current_streak}
                            <span className="ml-1 text-sm font-medium text-muted">
                                hari
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4 rounded-3xl bg-surface p-5 sm:p-6">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-2xl">
                        <Zap className="size-6 text-violet-600" />
                    </span>
                    <div>
                        <p className="text-sm text-muted">Streak terpanjang</p>
                        <p className="mt-0.5 text-2xl font-extrabold tracking-tight text-ink">
                            {stats.longest_streak}
                            <span className="ml-1 text-sm font-medium text-muted">
                                hari
                            </span>
                        </p>
                    </div>
                </div>
            </section>

            {/* Badge showcase */}
            {badges.length > 0 && (
                <section className="mt-5">
                    <BadgeShowcase badges={badges} />
                </section>
            )}

            {/* PKL info */}
            <section className="mt-5 rounded-3xl bg-surface p-5 sm:p-6">
                <h3 className="text-base font-bold text-ink">Informasi PKL</h3>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                        <dt className="text-xs text-muted">Industri</dt>
                        <dd className="mt-1 font-semibold text-ink">
                            {profile.industry ?? '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted">Periode</dt>
                        <dd className="mt-1 font-semibold text-ink">
                            {profile.period ?? '—'}
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs text-muted">Status</dt>
                        <dd className="mt-1">
                            {profile.status_pkl ? (
                                <span
                                    className={cn(
                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                        statusStyles[profile.status_pkl],
                                    )}
                                >
                                    {statusLabels[profile.status_pkl]}
                                </span>
                            ) : (
                                <span className="text-muted">—</span>
                            )}
                        </dd>
                    </div>
                </dl>
            </section>
        </AppLayout>
    );
}
