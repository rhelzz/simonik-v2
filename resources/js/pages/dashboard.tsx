import { usePage } from '@inertiajs/react';
import {
    Building2,
    GraduationCap,
    UserCheck,
    Users,
    Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

type StatusPkl = 'belum' | 'proses' | 'selesai';

type DashboardProps = {
    stats: {
        students: number;
        activePkl: number;
        industries: number;
        teachers: number;
        pembimbings: number;
    };
    recentStudents: Array<{
        id: number;
        name: string;
        nis: string;
        status_pkl: StatusPkl;
        class: string | null;
        industry: string | null;
        joined: string | null;
    }>;
    today: string;
};

function greeting(hour: number): string {
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

const statusStyles: Record<StatusPkl, string> = {
    belum: 'bg-canvas text-muted',
    proses: 'bg-warning/15 text-warning',
    selesai: 'bg-positive/15 text-positive',
};

const statusLabels: Record<StatusPkl, string> = {
    belum: 'Belum mulai',
    proses: 'Berjalan',
    selesai: 'Selesai',
};

function StatCard({
    icon: Icon,
    label,
    value,
    tint,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
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

export default function Dashboard({
    stats,
    recentStudents,
    today,
}: DashboardProps) {
    const { auth } = usePage<SharedData>().props;
    const firstName = (auth.user?.name ?? 'Pengelola').split(' ')[0];
    const hello = greeting(new Date().getHours());

    return (
        <AppLayout title="Dashboard">
            {/* Hero greeting — the signature card */}
            <section className="relative overflow-hidden rounded-3xl bg-primary p-6 text-white sm:p-8">
                <div className="absolute -top-16 -right-10 size-56 rounded-full bg-white/10" />
                <div className="absolute -right-16 -bottom-24 size-64 rounded-full bg-white/5" />
                <div className="relative max-w-xl">
                    <p className="text-sm font-medium text-white/70">{today}</p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                        {hello}, {firstName} 👋
                    </h2>
                    <p className="mt-2 text-sm text-white/80">
                        Saat ini <strong>{stats.activePkl}</strong> siswa sedang
                        menjalani PKL dari total {stats.students} siswa
                        terdaftar. Pantau perkembangan mereka di sini.
                    </p>
                </div>
            </section>

            {/* Stat cards */}
            <section className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
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
                    label="Industri"
                    value={stats.industries}
                    tint="bg-positive/15 text-positive"
                />
                <StatCard
                    icon={Users}
                    label="Guru"
                    value={stats.teachers}
                    tint="bg-accent/15 text-accent"
                />
                <StatCard
                    icon={UserCheck}
                    label="Pembimbing"
                    value={stats.pembimbings}
                    tint="bg-primary-soft text-primary"
                />
            </section>

            {/* Recent students */}
            <section className="mt-5 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-ink">
                            Siswa terbaru
                        </h3>
                        <p className="text-sm text-muted">
                            Pendaftaran siswa PKL paling akhir
                        </p>
                    </div>
                </div>

                {recentStudents.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">
                        Belum ada data siswa. Jalankan seeder untuk mengisi data
                        contoh.
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-136 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">Nama</th>
                                    <th className="pb-3 font-semibold">
                                        Kelas
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {recentStudents.map((student) => (
                                    <tr key={student.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {student.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                NIS {student.nis}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.class ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.industry ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    statusStyles[
                                                        student.status_pkl
                                                    ],
                                                )}
                                            >
                                                {
                                                    statusLabels[
                                                        student.status_pkl
                                                    ]
                                                }
                                            </span>
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
