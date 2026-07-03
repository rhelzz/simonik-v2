import {
    Building2,
    Fingerprint,
    GraduationCap,
    NotebookPen,
    UserCheck,
    Users,
    Workflow,
} from 'lucide-react';
import {
    AttendanceTrendCards,
    HeroGreeting,
    RateCard,
    RecentStudentsTable,
    StatCard,
} from '@/components/dashboard/widgets';
import type {
    ParticipationTrend,
    RateByRange,
    RecentStudent,
} from '@/components/dashboard/widgets';
import { AppLayout } from '@/layouts/app-layout';

type DashboardProps = {
    stats: {
        students: number;
        activePkl: number;
        industries: number;
        teachers: number;
        pembimbings: number;
    };
    attendanceRate: RateByRange;
    journalRate: RateByRange;
    trend: ParticipationTrend;
    recentStudents: RecentStudent[];
    today: string;
};

export default function Dashboard({
    stats,
    attendanceRate,
    journalRate,
    trend,
    recentStudents,
    today,
}: DashboardProps) {
    return (
        <AppLayout title="Dashboard">
            <HeroGreeting today={today} fallbackName="Pengelola">
                Saat ini <strong>{stats.activePkl}</strong> siswa sedang
                menjalani PKL dari total {stats.students} siswa terdaftar.
                Pantau perkembangan mereka di sini.
            </HeroGreeting>

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

            <section className="mt-5 grid gap-4 lg:grid-cols-2">
                <RateCard
                    icon={Fingerprint}
                    title="Rate absensi"
                    subtitle="Siswa aktif yang hadir di tempat PKL"
                    data={attendanceRate}
                    tint="bg-primary-soft text-primary"
                />
                <RateCard
                    icon={NotebookPen}
                    title="Rate pengisian jurnal"
                    subtitle="Siswa aktif yang mengisi jurnal harian"
                    data={journalRate}
                    tint="bg-warning/15 text-warning"
                />
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-3">
                <AttendanceTrendCards data={trend} />
            </section>

            <div className="mt-5">
                <RecentStudentsTable
                    students={recentStudents}
                    title="Siswa terbaru"
                    subtitle="Pendaftaran siswa PKL paling akhir"
                    emptyText="Belum ada data siswa. Jalankan seeder untuk mengisi data contoh."
                />
            </div>
        </AppLayout>
    );
}
