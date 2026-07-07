import {
    BarChart3,
    Building2,
    GraduationCap,
    Network,
    UserCheck,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type DepartmentRow = {
    id: number;
    name: string;
    students: number;
    activePkl: number;
    journalMonth: number;
    attendanceMonth: number;
};

type TeacherRow = {
    id: number;
    name: string;
    department: string | null;
    industries: number;
    students: number;
};

type Props = {
    byDepartment: DepartmentRow[];
    teachers: TeacherRow[];
    totals: {
        departments: number;
        students: number;
        activePkl: number;
        industries: number;
        teachers: number;
    };
    today: string;
};

/** Satu angka kunci dalam ledger masthead — dipisah garis rambut, bukan kartu. */
function LedgerFigure({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
}) {
    return (
        <div className="flex min-w-0 flex-col gap-1 px-4 py-3 sm:px-5">
            <span className="flex items-center gap-1.5 text-[0.7rem] font-semibold tracking-wide text-white/50 uppercase">
                <Icon className="size-3.5" />
                {label}
            </span>
            <span className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
                {value.toLocaleString('id-ID')}
            </span>
        </div>
    );
}

/** Chip metrik kecil di baris jurusan. */
function MetricChip({
    label,
    value,
    tint,
}: {
    label: string;
    value: number;
    tint: string;
}) {
    return (
        <div className="flex flex-col items-center gap-0.5">
            <span className={cn('text-sm font-bold tabular-nums', tint)}>
                {value.toLocaleString('id-ID')}
            </span>
            <span className="text-[0.65rem] font-medium tracking-wide text-muted uppercase">
                {label}
            </span>
        </div>
    );
}

export default function StatistikIndex({
    byDepartment,
    teachers,
    totals,
    today,
}: Props) {
    const maxStudents = Math.max(1, ...byDepartment.map((d) => d.students));
    const ranked = [...byDepartment].sort((a, b) => b.students - a.students);
    const coverageMax = Math.max(1, ...teachers.map((t) => t.students));

    return (
        <AppLayout title="Statistik Global">
            {/* Masthead analitik — orientasi data, bukan sapaan personal */}
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-[#3a3f9e] text-white">
                <div className="absolute -top-24 -right-16 size-72 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-28 -left-10 size-64 rounded-full bg-accent/25 blur-3xl" />

                <div className="relative p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-white/50 uppercase">
                                <BarChart3 className="size-4" />
                                Supervisi Lintas Jurusan
                            </p>
                            <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Statistik Global
                            </h1>
                            <p className="mt-2 max-w-md text-sm text-white/70">
                                Rekap menyeluruh partisipasi PKL sekolah —
                                jurnal & kehadiran dihitung untuk bulan
                                berjalan.
                            </p>
                        </div>
                        <span className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80">
                            {today}
                        </span>
                    </div>

                    {/* Ledger angka kunci — hairline divider, bukan grid kartu */}
                    <div className="mt-7 grid grid-cols-2 divide-x divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] sm:grid-cols-5 sm:divide-y-0">
                        <LedgerFigure
                            icon={Network}
                            label="Jurusan"
                            value={totals.departments}
                        />
                        <LedgerFigure
                            icon={GraduationCap}
                            label="Siswa"
                            value={totals.students}
                        />
                        <LedgerFigure
                            icon={Workflow}
                            label="PKL berjalan"
                            value={totals.activePkl}
                        />
                        <LedgerFigure
                            icon={Building2}
                            label="Industri mitra"
                            value={totals.industries}
                        />
                        <LedgerFigure
                            icon={UserCheck}
                            label="Guru pembimbing"
                            value={totals.teachers}
                        />
                    </div>
                </div>
            </section>

            {/* Leaderboard jurusan — peringkat berbasis ukuran (bar komparatif) */}
            <section className="mt-6 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Peringkat Jurusan
                        </h2>
                        <p className="text-sm text-muted">
                            Diurutkan menurut jumlah siswa aktif.
                        </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                        {ranked.length} jurusan
                    </span>
                </div>

                {ranked.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">
                        Belum ada data jurusan.
                    </div>
                ) : (
                    <ol className="mt-5 space-y-3">
                        {ranked.map((dep, index) => (
                            <li
                                key={dep.id}
                                className="rounded-2xl border border-line bg-canvas/40 p-4 transition-colors hover:border-primary/30"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-extrabold text-primary tabular-nums">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="truncate font-bold text-ink">
                                                {dep.name}
                                            </p>
                                            <span className="shrink-0 text-sm font-bold text-ink tabular-nums">
                                                {dep.students}
                                                <span className="ml-1 text-xs font-medium text-muted">
                                                    siswa
                                                </span>
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                                            <div
                                                className="h-full rounded-full bg-primary transition-all"
                                                style={{
                                                    width: `${Math.max(
                                                        6,
                                                        (dep.students /
                                                            maxStudents) *
                                                            100,
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="hidden shrink-0 gap-5 pl-2 sm:flex">
                                        <MetricChip
                                            label="PKL"
                                            value={dep.activePkl}
                                            tint="text-warning"
                                        />
                                        <MetricChip
                                            label="Jurnal"
                                            value={dep.journalMonth}
                                            tint="text-primary"
                                        />
                                        <MetricChip
                                            label="Hadir"
                                            value={dep.attendanceMonth}
                                            tint="text-positive"
                                        />
                                    </div>
                                </div>

                                {/* Metrik untuk layar kecil */}
                                <div className="mt-3 flex justify-around border-t border-line pt-3 sm:hidden">
                                    <MetricChip
                                        label="PKL aktif"
                                        value={dep.activePkl}
                                        tint="text-warning"
                                    />
                                    <MetricChip
                                        label="Jurnal"
                                        value={dep.journalMonth}
                                        tint="text-primary"
                                    />
                                    <MetricChip
                                        label="Hadir"
                                        value={dep.attendanceMonth}
                                        tint="text-positive"
                                    />
                                </div>
                            </li>
                        ))}
                    </ol>
                )}
            </section>

            {/* Cakupan bimbingan guru */}
            <section className="mt-6 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-baseline justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Cakupan Bimbingan Guru
                        </h2>
                        <p className="text-sm text-muted">
                            Industri yang diampu & siswa bimbingan tiap guru
                            pembimbing.
                        </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-muted">
                        {teachers.length} guru
                    </span>
                </div>

                {teachers.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">
                        Belum ada data guru.
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-136 border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">Guru</th>
                                    <th className="pb-3 font-semibold">
                                        Jurusan
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Siswa bimbingan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {teachers.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td className="py-3 font-semibold text-ink">
                                            {teacher.name}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {teacher.department ?? '—'}
                                        </td>
                                        <td className="py-3 text-center text-ink/80 tabular-nums">
                                            {teacher.industries}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-line">
                                                    <div
                                                        className="h-full rounded-full bg-accent transition-all"
                                                        style={{
                                                            width: `${Math.max(
                                                                4,
                                                                (teacher.students /
                                                                    coverageMax) *
                                                                    100,
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="font-semibold text-ink tabular-nums">
                                                    {teacher.students}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </AppLayout>
    );
}
