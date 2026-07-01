import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Building2,
    GraduationCap,
    Handshake,
    UserCheck,
    Wallet,
    Workflow,
} from 'lucide-react';
import { index as financeIndex } from '@/actions/App/Http/Controllers/FinanceController';
import { index as partnershipsIndex } from '@/actions/App/Http/Controllers/PartnershipController';
import { index as statistikIndex } from '@/actions/App/Http/Controllers/StatistikController';
import { HeroGreeting, StatCard } from '@/components/dashboard/widgets';
import { AppLayout } from '@/layouts/app-layout';

type DashboardWakasekProps = {
    stats: {
        students: number;
        activePkl: number;
        industries: number;
        teachers: number;
    };
    today: string;
};

export default function DashboardWakasek({
    stats,
    today,
}: DashboardWakasekProps) {
    return (
        <AppLayout title="Dashboard">
            <HeroGreeting today={today} fallbackName="Wakasek">
                Selamat datang di dashboard Humas & Hubungan Industri. Saat ini
                terdapat <strong>{stats.activePkl}</strong> siswa yang sedang
                menjalani PKL dari <strong>{stats.industries}</strong> industri
                mitra.
            </HeroGreeting>

            <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={GraduationCap}
                    label="Total siswa"
                    value={stats.students}
                    tint="bg-primary-soft text-primary"
                />
                <StatCard
                    icon={Workflow}
                    label="PKL berjalan"
                    value={stats.activePkl}
                    tint="bg-warning/15 text-warning"
                />
                <StatCard
                    icon={Building2}
                    label="Industri mitra"
                    value={stats.industries}
                    tint="bg-accent/15 text-accent"
                />
                <StatCard
                    icon={UserCheck}
                    label="Guru pembimbing"
                    value={stats.teachers}
                    tint="bg-positive/15 text-positive"
                />
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-3">
                <QuickLinkCard
                    icon={Wallet}
                    title="Akuntabilitas Dana"
                    description="Catat penerimaan anggaran komite & realisasi pengeluaran operasional PKL."
                    href={financeIndex.url()}
                />
                <QuickLinkCard
                    icon={Handshake}
                    title="Kemitraan & Kuota"
                    description="Kelola daftar mitra industri dan tetapkan kuota penerimaan siswa PKL."
                    href={partnershipsIndex.url()}
                />
                <QuickLinkCard
                    icon={BarChart3}
                    title="Statistik Global"
                    description="Statistik keaktifan guru, presensi & jurnal per jurusan."
                    href={statistikIndex.url()}
                />
            </section>
        </AppLayout>
    );
}

function QuickLinkCard({
    icon: Icon,
    title,
    description,
    href,
}: {
    icon: React.ComponentType<{ className?: string }>;
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
