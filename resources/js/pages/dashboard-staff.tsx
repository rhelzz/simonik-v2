import { Link } from '@inertiajs/react';
import {
    Fingerprint,
    GraduationCap,
    NotebookPen,
    ShieldAlert,
    Workflow,
} from 'lucide-react';
import { index as attendanceMonitorIndex } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { index as journalMonitorIndex } from '@/actions/App/Http/Controllers/JournalMonitorController';
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
        pendingAttendance: number;
        pendingJournal: number;
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
    const pendingTotal = stats.pendingAttendance + stats.pendingJournal;

    return (
        <AppLayout title="Dashboard">
            <HeroGreeting today={today} fallbackName="Pembina">
                Anda membina <strong>{stats.students}</strong> siswa,{' '}
                <strong>{stats.activePkl}</strong> di antaranya sedang menjalani
                PKL.
                {pendingTotal > 0 ? (
                    <>
                        {' '}
                        Ada <strong>{pendingTotal}</strong> catatan menunggu
                        verifikasi Anda.
                    </>
                ) : (
                    ' Semua catatan sudah terverifikasi.'
                )}
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
                <Link href={attendanceMonitorIndex.url()} className="contents">
                    <StatCard
                        icon={Fingerprint}
                        label="Absen menunggu verifikasi"
                        value={stats.pendingAttendance}
                        tint="bg-accent/15 text-accent"
                    />
                </Link>
                <Link href={journalMonitorIndex.url()} className="contents">
                    <StatCard
                        icon={NotebookPen}
                        label="Jurnal menunggu verifikasi"
                        value={stats.pendingJournal}
                        tint="bg-positive/15 text-positive"
                    />
                </Link>
            </section>

            {pendingTotal > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                    <ShieldAlert className="size-4 shrink-0" />
                    <span>{pendingTotal} catatan belum diverifikasi —</span>
                    <Link
                        href={attendanceMonitorIndex.url()}
                        className="font-semibold underline underline-offset-2"
                    >
                        Data Absen
                    </Link>
                    <Link
                        href={journalMonitorIndex.url()}
                        className="font-semibold underline underline-offset-2"
                    >
                        Data Jurnal
                    </Link>
                </div>
            )}

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
