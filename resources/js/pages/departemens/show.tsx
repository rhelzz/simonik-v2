import { Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/DepartemenController';
import { AppLayout } from '@/layouts/app-layout';

type DepartemenShowProps = {
    departemen: {
        id: number;
        name: string;
        slug: string;
        classes_count: number;
        students_count: number;
    };
    classes: Array<{
        id: number;
        name: string;
        slug: string;
        students_count: number;
    }>;
};

export default function DepartemenShow({
    departemen,
    classes,
}: DepartemenShowProps) {
    return (
        <AppLayout title={`Detail Jurusan - ${departemen.name}`}>
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

                {/* Info Jurusan */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        {departemen.name}
                    </h2>
                    <div className="flex flex-wrap gap-6">
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Slug
                            </p>
                            <p className="text-sm text-ink">
                                {departemen.slug}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Jumlah Kelas
                            </p>
                            <p className="text-sm text-ink">
                                {departemen.classes_count} kelas
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Total Siswa
                            </p>
                            <p className="text-sm text-ink">
                                {departemen.students_count} siswa
                            </p>
                        </div>
                    </div>
                </section>

                {/* Daftar Kelas */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        Kelas Terhubung ({departemen.classes_count})
                    </h2>
                    {classes.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-12 text-center">
                            <BookOpen className="size-8 text-muted" />
                            <p className="text-sm font-medium text-ink">
                                Belum ada kelas
                            </p>
                            <p className="text-sm text-muted">
                                Tambahkan kelas untuk jurusan ini.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                        <th className="pb-3 font-semibold">
                                            Nama Kelas
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Slug
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Jumlah Siswa
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {classes.map((cls) => (
                                        <tr key={cls.id}>
                                            <td className="py-3 font-medium text-ink">
                                                {cls.name}
                                            </td>
                                            <td className="py-3 text-ink/60">
                                                {cls.slug}
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {cls.students_count} siswa
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
