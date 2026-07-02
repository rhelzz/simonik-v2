import { Link } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BarChart3,
    Building2,
    GraduationCap,
    Handshake,
    TriangleAlert,
    UserCheck,
    Wallet,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { index as financeIndex } from '@/actions/App/Http/Controllers/FinanceController';
import { index as partnershipsIndex } from '@/actions/App/Http/Controllers/PartnershipController';
import { index as statistikIndex } from '@/actions/App/Http/Controllers/StatistikController';
import {
    HeroGreeting,
    RateCard,
    StatCard,
} from '@/components/dashboard/widgets';
import type { RateByRange } from '@/components/dashboard/widgets';
import { AppLayout } from '@/layouts/app-layout';

type Department = {
    id: number;
    name: string;
    students: number;
    activePkl: number;
};

type DashboardWakasekProps = {
    stats: {
        students: number;
        activePkl: number;
        industries: number;
        teachers: number;
    };
    finance: {
        receipts: number;
        expenses: number;
        balance: number;
    };
    capacity: {
        partners: number;
        quota: number;
        placed: number;
        remaining: number;
        utilization: number;
        over: number;
    };
    attendanceRate: RateByRange;
    journalRate: RateByRange;
    byDepartment: Department[];
    today: string;
};

const rupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(value);

export default function DashboardWakasek({
    stats,
    finance,
    capacity,
    attendanceRate,
    journalRate,
    byDepartment,
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

            {/* Akuntabilitas dana + daya tampung kemitraan */}
            <section className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                                <Wallet className="size-5" />
                            </span>
                            <div>
                                <h3 className="text-base font-bold text-ink">
                                    Akuntabilitas Dana
                                </h3>
                                <p className="text-xs text-muted">
                                    Saldo dana PKL berjalan
                                </p>
                            </div>
                        </div>
                        <Link
                            href={financeIndex.url()}
                            className="text-xs font-semibold text-primary hover:underline"
                        >
                            Kelola
                        </Link>
                    </div>

                    <p className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
                        {rupiah(finance.balance)}
                    </p>
                    <p className="text-sm text-muted">Saldo tersedia</p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-positive/10 p-4">
                            <span className="flex items-center gap-1 text-xs font-semibold text-positive">
                                <ArrowUpRight className="size-3.5" />
                                Penerimaan
                            </span>
                            <p className="mt-1 text-sm font-bold text-ink">
                                {rupiah(finance.receipts)}
                            </p>
                        </div>
                        <div className="rounded-2xl bg-red-500/10 p-4">
                            <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
                                <ArrowDownRight className="size-3.5" />
                                Pengeluaran
                            </span>
                            <p className="mt-1 text-sm font-bold text-ink">
                                {rupiah(finance.expenses)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="grid size-11 place-items-center rounded-xl bg-accent/15 text-accent">
                                <Handshake className="size-5" />
                            </span>
                            <div>
                                <h3 className="text-base font-bold text-ink">
                                    Daya Tampung Kemitraan
                                </h3>
                                <p className="text-xs text-muted">
                                    {capacity.partners} mitra industri
                                </p>
                            </div>
                        </div>
                        <Link
                            href={partnershipsIndex.url()}
                            className="text-xs font-semibold text-primary hover:underline"
                        >
                            Kelola
                        </Link>
                    </div>

                    <div className="mt-5 flex items-baseline gap-2">
                        <p className="text-3xl font-extrabold tracking-tight text-ink">
                            {capacity.placed}
                        </p>
                        <p className="text-sm text-muted">
                            / {capacity.quota} kuota terisi
                        </p>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                        <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${capacity.utilization}%` }}
                        />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-muted">
                            Sisa kuota:{' '}
                            <strong className="text-ink">
                                {capacity.remaining}
                            </strong>
                        </span>
                        {capacity.over > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-500">
                                <TriangleAlert className="size-3.5" />
                                {capacity.over} mitra kelebihan
                            </span>
                        ) : (
                            <span className="rounded-full bg-positive/10 px-2.5 py-1 text-xs font-semibold text-positive">
                                Kapasitas aman
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {/* Partisipasi presensi & jurnal (supervisi global) */}
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

            {/* Rekap per jurusan */}
            <section className="mt-4 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-ink">
                            Rekap per Program Keahlian
                        </h3>
                        <p className="text-sm text-muted">
                            Sebaran siswa & PKL aktif tiap jurusan
                        </p>
                    </div>
                    <Link
                        href={statistikIndex.url()}
                        className="text-xs font-semibold text-primary hover:underline"
                    >
                        Statistik lengkap
                    </Link>
                </div>

                {byDepartment.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">
                        Belum ada data jurusan.
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Jurusan
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Total siswa
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        PKL berjalan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {byDepartment.map((dep) => (
                                    <tr key={dep.id}>
                                        <td className="py-3 font-semibold text-ink">
                                            {dep.name}
                                        </td>
                                        <td className="py-3 text-right text-ink/80">
                                            {dep.students}
                                        </td>
                                        <td className="py-3 text-right">
                                            <span className="inline-flex rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
                                                {dep.activePkl}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Pintasan fitur */}
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
