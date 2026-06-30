import {
    BarChart3,
    Building2,
    GraduationCap,
    Handshake,
    UserCheck,
    Wallet,
    Workflow,
} from 'lucide-react';
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
                <ComingSoonCard
                    icon={Wallet}
                    title="Akuntabilitas Dana"
                    description="Rekap penerimaan anggaran komite & realisasi pengeluaran operasional PKL."
                    module="M5.1"
                />
                <ComingSoonCard
                    icon={Handshake}
                    title="Kemitraan & Kuota"
                    description="Kelola daftar mitra industri dan tetapkan kuota penerimaan siswa PKL."
                    module="M5.2"
                />
                <ComingSoonCard
                    icon={BarChart3}
                    title="Statistik Global"
                    description="Statistik keaktifan guru, presensi per jurusan, dan dokumentasi monitoring."
                    module="M5.3"
                />
            </section>
        </AppLayout>
    );
}

function ComingSoonCard({
    icon: Icon,
    title,
    description,
    module,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    module: string;
}) {
    return (
        <div className="rounded-xl border border-dashed bg-canvas p-5 opacity-60">
            <div className="mb-3 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                </span>
                <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <span className="text-muted-foreground rounded bg-muted px-1.5 py-0.5 text-xs font-medium">
                        {module} · Segera hadir
                    </span>
                </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
            </p>
        </div>
    );
}
