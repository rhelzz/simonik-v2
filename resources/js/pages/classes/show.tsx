import { Link } from '@inertiajs/react';
import { ArrowLeft, Users } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/ClassController';
import { AppLayout } from '@/layouts/app-layout';

type ClassShowProps = {
    class: {
        id: number;
        name: string;
        slug: string;
        departemen: string | null;
        students_count: number;
    };
    students: Array<{
        id: number;
        name: string;
        nis: string;
        gender: string;
        status_pkl: string;
        industri: string | null;
    }>;
};

const statusLabels: Record<string, string> = {
    belum: 'Belum mulai',
    proses: 'Berjalan',
    selesai: 'Selesai',
};

const statusStyles: Record<string, string> = {
    belum: 'bg-canvas text-muted',
    proses: 'bg-warning/15 text-warning',
    selesai: 'bg-positive/15 text-positive',
};

export default function ClassShow({ class: cls, students }: ClassShowProps) {
    return (
        <AppLayout title={`Detail Kelas - ${cls.name}`}>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href={index.url()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali
                    </Link>
                </div>

                {/* Info Kelas */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        {cls.name}
                    </h2>
                    <div className="flex flex-wrap gap-6">
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Jurusan
                            </p>
                            <p className="text-sm text-ink">
                                {cls.departemen ?? '—'}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Slug
                            </p>
                            <p className="text-sm text-ink">{cls.slug}</p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Total Siswa
                            </p>
                            <p className="text-sm text-ink">
                                {cls.students_count} siswa
                            </p>
                        </div>
                    </div>
                </section>

                {/* Daftar Siswa */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        Siswa ({cls.students_count})
                    </h2>
                    {students.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-12 text-center">
                            <Users className="size-8 text-muted" />
                            <p className="text-sm font-medium text-ink">
                                Belum ada siswa di kelas ini
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-160 border-collapse text-left text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                        <th className="pb-3 font-semibold">
                                            Nama
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            NIS
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Jenis Kelamin
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Industri PKL
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Status PKL
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="py-3 font-medium text-ink">
                                                {student.name}
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {student.nis}
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {student.gender}
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {student.industri ?? '—'}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status_pkl] ?? 'bg-canvas text-muted'}`}
                                                >
                                                    {statusLabels[
                                                        student.status_pkl
                                                    ] ?? student.status_pkl}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
