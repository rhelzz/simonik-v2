import {
    BarChart3,
    GraduationCap,
    Network,
    UserCheck,
    Workflow,
} from 'lucide-react';
import { HeroGreeting, StatCard } from '@/components/dashboard/widgets';
import { AppLayout } from '@/layouts/app-layout';

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

export default function StatistikIndex({
    byDepartment,
    teachers,
    totals,
    today,
}: Props) {
    return (
        <AppLayout title="Statistik Global">
            <HeroGreeting today={today} fallbackName="Wakasek">
                Ringkasan supervisi lintas jurusan:{' '}
                <strong>{totals.students}</strong> siswa di{' '}
                <strong>{totals.departments}</strong> jurusan,{' '}
                <strong>{totals.activePkl}</strong> sedang PKL di{' '}
                <strong>{totals.industries}</strong> industri mitra.
            </HeroGreeting>

            <section className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                    icon={Network}
                    label="Jurusan"
                    value={totals.departments}
                    tint="bg-primary-soft text-primary"
                />
                <StatCard
                    icon={GraduationCap}
                    label="Total siswa"
                    value={totals.students}
                    tint="bg-accent/15 text-accent"
                />
                <StatCard
                    icon={Workflow}
                    label="PKL berjalan"
                    value={totals.activePkl}
                    tint="bg-warning/15 text-warning"
                />
                <StatCard
                    icon={UserCheck}
                    label="Guru pembimbing"
                    value={totals.teachers}
                    tint="bg-positive/15 text-positive"
                />
            </section>

            {/* Statistik per jurusan */}
            <section className="mt-6 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-center gap-2">
                    <BarChart3 className="size-5 text-primary" />
                    <h3 className="text-base font-bold text-ink">
                        Statistik per Jurusan
                    </h3>
                </div>
                <p className="text-sm text-muted">
                    Jurnal & kehadiran dihitung untuk bulan berjalan.
                </p>

                {byDepartment.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">
                        Belum ada data jurusan.
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Jurusan
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        PKL aktif
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        Jurnal (bln ini)
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        Hadir (bln ini)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {byDepartment.map((dep) => (
                                    <tr key={dep.id}>
                                        <td className="py-3 font-semibold text-ink">
                                            {dep.name}
                                        </td>
                                        <td className="py-3 text-center text-ink/80">
                                            {dep.students}
                                        </td>
                                        <td className="py-3 text-center text-ink/80">
                                            {dep.activePkl}
                                        </td>
                                        <td className="py-3 text-center text-ink/80">
                                            {dep.journalMonth}
                                        </td>
                                        <td className="py-3 text-center text-ink/80">
                                            {dep.attendanceMonth}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Aktivitas guru */}
            <section className="mt-6 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-center gap-2">
                    <UserCheck className="size-5 text-primary" />
                    <h3 className="text-base font-bold text-ink">
                        Cakupan Bimbingan Guru
                    </h3>
                </div>
                <p className="text-sm text-muted">
                    Industri yang diampu & siswa bimbingan tiap guru pembimbing.
                </p>

                {teachers.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">
                        Belum ada data guru.
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-136 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">Guru</th>
                                    <th className="pb-3 font-semibold">
                                        Jurusan
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 text-center font-semibold">
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
                                        <td className="py-3 text-center text-ink/80">
                                            {teacher.industries}
                                        </td>
                                        <td className="py-3 text-center text-ink/80">
                                            {teacher.students}
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
