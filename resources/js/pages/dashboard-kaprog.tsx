import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    ClipboardList,
    GraduationCap,
    MailCheck,
    MapPin,
    Network,
    UserCheck,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { index as approvalsIndex } from '@/actions/App/Http/Controllers/ApprovalController';
import { index as industriesIndex } from '@/actions/App/Http/Controllers/IndustryController';
import { index as placementsIndex } from '@/actions/App/Http/Controllers/PlacementController';
import {
    HeroGreeting,
    RateCard,
    RecentStudentsTable,
    StatCard,
} from '@/components/dashboard/widgets';
import type {
    RateByRange,
    RecentStudent,
} from '@/components/dashboard/widgets';
import { AppLayout } from '@/layouts/app-layout';

type DashboardKaprogProps = {
    stats: {
        departemens: number;
        students: number;
        activePkl: number;
        notStarted: number;
    };
    departemens: string[];
    attendanceRate: RateByRange;
    journalRate: RateByRange;
    notStartedStudents: RecentStudent[];
    today: string;
};

export default function DashboardKaprog({
    stats,
    departemens,
    attendanceRate,
    journalRate,
    notStartedStudents,
    today,
}: DashboardKaprogProps) {
    const noProgram = stats.departemens === 0;

    return (
        <AppLayout title="Dashboard">
            <HeroGreeting today={today} fallbackName="Kaprog">
                {noProgram ? (
                    <>
                        Anda belum ditugaskan pada program keahlian mana pun.
                        Hubungi admin untuk menetapkan jurusan yang Anda pimpin.
                    </>
                ) : (
                    <>
                        Program keahlian:{' '}
                        <strong>{departemens.join(', ')}</strong>. Terdapat{' '}
                        <strong>{stats.activePkl}</strong> siswa sedang PKL dan{' '}
                        <strong>{stats.notStarted}</strong> belum ditempatkan.
                    </>
                )}
            </HeroGreeting>

            <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={Network}
                    label="Program keahlian"
                    value={stats.departemens}
                    tint="bg-primary-soft text-primary"
                />
                <StatCard
                    icon={GraduationCap}
                    label="Total siswa"
                    value={stats.students}
                    tint="bg-accent/15 text-accent"
                />
                <StatCard
                    icon={Workflow}
                    label="PKL berjalan"
                    value={stats.activePkl}
                    tint="bg-positive/15 text-positive"
                />
                <StatCard
                    icon={ClipboardList}
                    label="Belum mulai PKL"
                    value={stats.notStarted}
                    tint="bg-warning/15 text-warning"
                />
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-2">
                <RateCard
                    icon={UserCheck}
                    title="Rate Presensi"
                    subtitle="Kehadiran siswa aktif PKL"
                    data={attendanceRate}
                    tint="bg-primary-soft text-primary"
                />
                <RateCard
                    icon={BarChart3}
                    title="Rate Pengisian Jurnal"
                    subtitle="Keaktifan jurnal harian siswa"
                    data={journalRate}
                    tint="bg-accent/15 text-accent"
                />
            </section>

            <section className="mt-4 grid gap-4 lg:grid-cols-3">
                <QuickLinkCard
                    icon={ClipboardList}
                    title="Plotting & Penempatan"
                    description="Tempatkan siswa ke industri & tentukan guru pembimbing."
                    href={placementsIndex.url()}
                />
                <QuickLinkCard
                    icon={MapPin}
                    title="Manajemen Koordinat"
                    description="Perbarui titik & radius industri di program keahlian Anda."
                    href={industriesIndex.url()}
                />
                <QuickLinkCard
                    icon={MailCheck}
                    title="Inbox Persetujuan"
                    description="Validator cadangan untuk WFA & pengajuan libur siswa."
                    href={approvalsIndex.url()}
                />
            </section>

            <div className="mt-4">
                <RecentStudentsTable
                    students={notStartedStudents}
                    title="Siswa belum ditempatkan"
                    subtitle="Perlu segera di-plotting ke industri"
                    emptyText="Semua siswa sudah ditempatkan. 🎉"
                />
            </div>
        </AppLayout>
    );
}

function QuickLinkCard({
    icon: Icon,
    title,
    description,
    href,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group rounded-2xl bg-surface p-5 transition-colors hover:bg-primary-soft"
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="size-5" />
                </span>
                <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
            <p className="text-sm font-bold text-ink">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">
                {description}
            </p>
        </Link>
    );
}
