import { usePage } from '@inertiajs/react';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Building2, CalendarCheck, GraduationCap, NotebookPen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Bar } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Filler,
    Tooltip,
);

export type StatusPkl = 'belum' | 'proses' | 'selesai';

export type RangeKey = 'today' | 'week' | 'month' | 'all';
export type RateByRange = Record<RangeKey, number>;

export type TrendPoint = { label: string; value: number };
export type TrendSeries = { total: number; points: TrendPoint[] };
export type TrendShape = { week: TrendSeries; month: TrendSeries };
export type ParticipationTrend = {
    attendance: TrendShape;
    journal: TrendShape;
};

const rangeOrder: RangeKey[] = ['today', 'week', 'month', 'all'];
const rangeLabels: Record<RangeKey, string> = {
    today: 'Hari ini',
    week: 'Minggu ini',
    month: 'Bulan ini',
    all: 'Keseluruhan',
};

export const statusStyles: Record<StatusPkl, string> = {
    belum: 'bg-canvas text-muted',
    proses: 'bg-warning/15 text-warning',
    selesai: 'bg-positive/15 text-positive',
};

export const statusLabels: Record<StatusPkl, string> = {
    belum: 'Belum mulai',
    proses: 'Berjalan',
    selesai: 'Selesai',
};

export function greeting(hour: number): string {
    if (hour < 11) {
        return 'Selamat pagi';
    }

    if (hour < 15) {
        return 'Selamat siang';
    }

    if (hour < 19) {
        return 'Selamat sore';
    }

    return 'Selamat malam';
}

/** Hero greeting card — the signature dashboard header. */
export function HeroGreeting({
    today,
    children,
    fallbackName = 'Pengguna',
}: {
    today: string;
    children: ReactNode;
    fallbackName?: string;
}) {
    const { auth } = usePage<SharedData>().props;
    const firstName = (auth.user?.name ?? fallbackName).split(' ')[0];

    return (
        <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white sm:p-8">
            <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10" />
            <div className="absolute -right-16 -bottom-24 size-64 rounded-full bg-white/5" />
            <img
                src="/images/admin-greeting.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-15 hidden h-[230%] max-h-none object-contain object-bottom drop-shadow-2xl sm:block lg:h-[260%]"
            />
            <div className="relative max-w-xl">
                <p className="text-sm font-medium text-white/70">{today}</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {greeting(new Date().getHours())}, {firstName}
                </h2>
                <div className="mt-2 text-sm text-white/80">{children}</div>
            </div>
        </section>
    );
}

export function StatCard({
    icon: Icon,
    label,
    value,
    tint,
}: {
    icon: LucideIcon;
    label: string;
    value: number | string;
    tint: string;
}) {
    return (
        <div className="rounded-2xl bg-surface p-5">
            <span
                className={cn(
                    'grid size-11 place-items-center rounded-xl',
                    tint,
                )}
            >
                <Icon className="size-5" />
            </span>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
                {value}
            </p>
            <p className="text-sm font-medium text-muted">{label}</p>
        </div>
    );
}

export function RateCard({
    icon: Icon,
    title,
    subtitle,
    data,
    tint,
}: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
    data: RateByRange;
    tint: string;
}) {
    const [range, setRange] = useState<RangeKey>('month');
    const value = data[range];

    return (
        <div className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        'grid size-11 place-items-center rounded-xl',
                        tint,
                    )}
                >
                    <Icon className="size-5" />
                </span>
                <div>
                    <h3 className="text-base font-bold text-ink">{title}</h3>
                    <p className="text-xs text-muted">{subtitle}</p>
                </div>
            </div>

            <div className="mt-4 flex gap-1 rounded-xl bg-canvas p-1">
                {rangeOrder.map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setRange(key)}
                        className={cn(
                            'flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors',
                            range === key
                                ? 'bg-surface text-primary shadow-sm'
                                : 'text-muted hover:text-ink',
                        )}
                    >
                        {rangeLabels[key]}
                    </button>
                ))}
            </div>

            <p className="mt-5 text-4xl font-extrabold tracking-tight text-ink">
                {value}
                <span className="text-xl font-bold text-muted">%</span>
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

type TrendRange = 'week' | 'month';
type TrendSource = 'attendance' | 'journal';

const trendRangeLabels: Record<TrendRange, string> = {
    week: 'Per Minggu',
    month: 'Per Bulan',
};

const trendRangeHint: Record<TrendRange, string> = {
    week: '7 hari terakhir',
    month: '4 minggu terakhir',
};

const trendSourceMeta: Record<
    TrendSource,
    {
        toggle: string;
        countTitle: string;
        countSubtitle: string;
        chartTitle: string;
        chartSubtitle: string;
        unit: string;
        color: string;
        colorHover: string;
        icon: LucideIcon;
        iconTint: string;
    }
> = {
    attendance: {
        toggle: 'Absen',
        countTitle: 'Jumlah absen',
        countSubtitle: 'Kehadiran siswa aktif',
        chartTitle: 'Grafik absensi',
        chartSubtitle: 'Tren jumlah absen',
        unit: 'absen',
        color: '#4f5bd5',
        colorHover: '#4450c4',
        icon: CalendarCheck,
        iconTint: 'bg-primary-soft text-primary',
    },
    journal: {
        toggle: 'Jurnal',
        countTitle: 'Jumlah jurnal',
        countSubtitle: 'Pengisian jurnal harian',
        chartTitle: 'Grafik jurnal',
        chartSubtitle: 'Tren pengisian jurnal',
        unit: 'jurnal',
        color: '#f2a93b',
        colorHover: '#dd9424',
        icon: NotebookPen,
        iconTint: 'bg-warning/15 text-warning',
    },
};

/**
 * Dua kartu bersanding: jumlah + grafik tren partisipasi siswa aktif, dengan
 * toggle sumber data (absen ⇄ jurnal) dan rentang (minggu ⇄ bulan).
 * Dirender sebagai fragment agar kedua kartu menjadi anak langsung grid pemanggil.
 */
export function AttendanceTrendCards({ data }: { data: ParticipationTrend }) {
    const [source, setSource] = useState<TrendSource>('attendance');
    const [range, setRange] = useState<TrendRange>('week');
    const meta = trendSourceMeta[source];
    const SourceIcon = meta.icon;
    const series = data[source][range];

    const chartData = {
        labels: series.points.map((point) => point.label),
        datasets: [
            {
                label: meta.toggle,
                data: series.points.map((point) => point.value),
                backgroundColor: meta.color,
                hoverBackgroundColor: meta.colorHover,
                borderRadius: 10,
                borderSkipped: false as const,
                maxBarThickness: 56,
            },
        ],
    };

    const chartOptions: ChartOptions<'bar'> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 500 },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1f2348',
                padding: 12,
                cornerRadius: 12,
                titleFont: { family: 'Poppins', weight: 'bold' },
                bodyFont: { family: 'Poppins' },
                callbacks: {
                    label: (item) => ` ${item.formattedValue} ${meta.unit}`,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#8b8fb3', font: { family: 'Poppins', size: 12 } },
            },
            y: {
                beginAtZero: true,
                grid: { color: '#ececf4' },
                border: { display: false },
                ticks: {
                    precision: 0,
                    color: '#8b8fb3',
                    font: { family: 'Poppins', size: 12 },
                },
            },
        },
    };

    return (
        <>
            {/* Kartu jumlah */}
            <div className="flex flex-col rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-center gap-3">
                    <span
                        className={cn(
                            'grid size-11 place-items-center rounded-xl',
                            meta.iconTint,
                        )}
                    >
                        <SourceIcon className="size-5" />
                    </span>
                    <div>
                        <h3 className="text-base font-bold text-ink">
                            {meta.countTitle}
                        </h3>
                        <p className="text-xs text-muted">
                            {meta.countSubtitle}
                        </p>
                    </div>
                </div>

                {/* Toggle sumber data: absen ⇄ jurnal */}
                <div className="mt-5 flex gap-1 rounded-xl bg-canvas p-1">
                    {(['attendance', 'journal'] as TrendSource[]).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setSource(key)}
                            className={cn(
                                'flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors',
                                source === key
                                    ? 'bg-surface text-primary shadow-sm'
                                    : 'text-muted hover:text-ink',
                            )}
                        >
                            {trendSourceMeta[key].toggle}
                        </button>
                    ))}
                </div>

                <div className="mt-6 flex flex-1 flex-col justify-center">
                    <p className="text-5xl font-extrabold tracking-tight text-ink">
                        {series.total.toLocaleString('id-ID')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-muted">
                        total {meta.unit} · {trendRangeHint[range]}
                    </p>
                </div>
            </div>

            {/* Kartu grafik tren */}
            <div className="rounded-3xl bg-surface p-5 sm:p-6 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-bold text-ink">
                            {meta.chartTitle}
                        </h3>
                        <p className="text-xs text-muted">
                            {meta.chartSubtitle} · {trendRangeHint[range]}
                        </p>
                    </div>

                    <div className="flex gap-1 rounded-xl bg-canvas p-1">
                        {(['week', 'month'] as TrendRange[]).map((key) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setRange(key)}
                                className={cn(
                                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                                    range === key
                                        ? 'bg-surface text-primary shadow-sm'
                                        : 'text-muted hover:text-ink',
                                )}
                            >
                                {trendRangeLabels[key]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-6 h-72">
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>
        </>
    );
}

export type RecentStudent = {
    id: number;
    name: string;
    nis: string;
    status_pkl: StatusPkl;
    class: string | null;
    industry: string | null;
    joined: string | null;
};

/** Warna avatar deterministik dari nama agar konsisten antar-render. */
const avatarTints = [
    'bg-primary-soft text-primary',
    'bg-warning/15 text-warning',
    'bg-positive/15 text-positive',
    'bg-accent/15 text-accent',
];

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';

    return (first + last).toUpperCase();
}

function avatarTint(name: string): string {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return avatarTints[Math.abs(hash) % avatarTints.length];
}

export function RecentStudentsTable({
    students,
    title,
    subtitle,
    emptyText,
}: {
    students: RecentStudent[];
    title: string;
    subtitle: string;
    emptyText: string;
}) {
    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <h3 className="text-base font-bold text-ink">{title}</h3>
                    <p className="text-sm text-muted">{subtitle}</p>
                </div>
                {students.length > 0 && (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
                        <GraduationCap className="size-3.5" />
                        {students.length} siswa
                    </span>
                )}
            </div>

            {students.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-canvas text-muted">
                        <GraduationCap className="size-6" />
                    </span>
                    <p className="mt-3 text-sm text-muted">{emptyText}</p>
                </div>
            ) : (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-160 border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                                <th className="pb-3 font-semibold">Siswa</th>
                                <th className="pb-3 font-semibold">Kelas</th>
                                <th className="pb-3 font-semibold">Industri</th>
                                <th className="pb-3 font-semibold">Bergabung</th>
                                <th className="pb-3 text-right font-semibold">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr
                                    key={student.id}
                                    className="group border-b border-line/70 transition-colors last:border-0 hover:bg-canvas/60"
                                >
                                    <td className="rounded-l-xl py-3">
                                        <div className="flex items-center gap-3">
                                            <span
                                                className={cn(
                                                    'grid size-10 shrink-0 place-items-center rounded-full text-xs font-bold',
                                                    avatarTint(student.name),
                                                )}
                                            >
                                                {initials(student.name)}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-ink">
                                                    {student.name}
                                                </p>
                                                <p className="text-xs text-muted">
                                                    NIS {student.nis}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 text-ink/80">
                                        {student.class ?? '—'}
                                    </td>
                                    <td className="py-3 text-ink/80">
                                        {student.industry ? (
                                            <span className="inline-flex items-center gap-1.5">
                                                <Building2 className="size-3.5 shrink-0 text-muted" />
                                                <span className="truncate">
                                                    {student.industry}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-muted">
                                                Belum ditempatkan
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 text-ink/70">
                                        {student.joined ?? '—'}
                                    </td>
                                    <td className="rounded-r-xl py-3 text-right">
                                        <span
                                            className={cn(
                                                'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                statusStyles[
                                                    student.status_pkl
                                                ],
                                            )}
                                        >
                                            {statusLabels[student.status_pkl]}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
