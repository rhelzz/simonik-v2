import { Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Award,
    Building2,
    ClipboardCheck,
    Fingerprint,
    GraduationCap,
    NotebookPen,
    Workflow,
} from 'lucide-react';
import { index as assessmentsIndex } from '@/actions/App/Http/Controllers/AssessmentController';
import { AnnouncementBoard } from '@/components/announcements/announcement-board';
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
    scopeLabel?: string;
    today: string;
    dudiIncomplete?: boolean;
};

export default function DashboardStaff({
    stats,
    attendanceRate,
    journalRate,
    recentStudents,
    scopeLabel,
    today,
    dudiIncomplete,
}: DashboardStaffProps) {
    return (
        <AppLayout title="Dashboard">
            {dudiIncomplete && (
                <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                            <AlertTriangle className="size-5" />
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-amber-900">
                                Profil Industri (DUDI) Belum Lengkap
                            </h3>
                            <p className="mt-0.5 text-xs text-amber-800">
                                Harap segera melengkapi 15 rincian data DUDI perusahaan Anda untuk sinkronisasi kelengkapan e-Rapor Kemendikdasmen.
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/profile?tab=industry"
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-amber-700"
                    >
                        <Building2 className="size-4" />
                        Lengkapi Profil Industri
                        <ArrowRight className="size-3.5" />
                    </Link>
                </div>
            )}

            <HeroGreeting today={today} fallbackName="Pembina">
                Anda membina <strong>{stats.students}</strong> siswa,{' '}
                <strong>{stats.activePkl}</strong> di antaranya sedang menjalani
                PKL. Pantau performa absen, jurnal, dan nilai anak magang Anda
                di bawah.
            </HeroGreeting>

            <AnnouncementBoard />

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
                    title="Siswa bimbingan"
                    subtitle={scopeLabel ?? 'Siswa dalam cakupan Anda'}
                    emptyText="Belum ada siswa dalam cakupan Anda."
                />
            </div>
        </AppLayout>
    );
}
