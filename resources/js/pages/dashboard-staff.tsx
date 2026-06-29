import { Link } from '@inertiajs/react';
import {
    Award,
    ClipboardCheck,
    Fingerprint,
    GraduationCap,
    NotebookPen,
    Workflow,
} from 'lucide-react';
import { index as assessmentsIndex } from '@/actions/App/Http/Controllers/AssessmentController';
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

type DashboardStaffProps = {
    stats: {
        students: number;
        activePkl: number;
        assessed: number;
        avgScore: number | null;
    };
    attendanceRate: RateByRange;
    journalRate: RateByRange;
    recentStudents: RecentStudent[];
    today: string;
};

export default function DashboardStaff({
    stats,
    attendanceRate,
    journalRate,
    recentStudents,
    today,
}: DashboardStaffProps) {
    return (
        <AppLayout title="Dashboard">
            <HeroGreeting today={today} fallbackName="Pembina">
                Anda membina <strong>{stats.students}</strong> siswa,{' '}
                <strong>{stats.activePkl}</strong> di antaranya sedang menjalani
                PKL. Pantau performa absen, jurnal, dan nilai anak magang Anda
                di bawah.
            </HeroGreeting>

            <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={GraduationCap}
                    label="Siswa dibina"
                    value={stats.students}
                    tint="bg-primary-soft text-primary"
                />
                <StatCard
                    icon={Workflow}
                    label="PKL berjalan"
                    value={stats.activePkl}
                    tint="bg-warning/15 text-warning"
                />
                <Link href={assessmentsIndex.url()} className="contents">
                    <StatCard
                        icon={ClipboardCheck}
                        label="Sudah dinilai"
                        value={stats.assessed}
                        tint="bg-accent/15 text-accent"
                    />
                </Link>
                <StatCard
                    icon={Award}
                    label="Rata-rata nilai"
                    value={stats.avgScore ?? '—'}
                    tint="bg-positive/15 text-positive"
                />
            </section>

            <section className="mt-5 grid gap-4 lg:grid-cols-2">
                <RateCard
                    icon={Fingerprint}
                    title="Rate absensi"
                    subtitle="Siswa Anda yang hadir di tempat PKL"
                    data={attendanceRate}
                    tint="bg-primary-soft text-primary"
                />
                <RateCard
                    icon={NotebookPen}
                    title="Rate pengisian jurnal"
                    subtitle="Siswa Anda yang mengisi jurnal harian"
                    data={journalRate}
                    tint="bg-warning/15 text-warning"
                />
            </section>

            <div className="mt-5">
                <RecentStudentsTable
                    students={recentStudents}
                    title="Siswa bimbingan terbaru"
                    subtitle="Siswa dalam cakupan Anda"
                    emptyText="Belum ada siswa dalam cakupan Anda."
                />
            </div>
        </AppLayout>
    );
}
