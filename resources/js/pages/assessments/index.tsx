import { Link, router } from '@inertiajs/react';
import { ClipboardList, Search } from 'lucide-react';
import { useState } from 'react';
import {
    index,
    show,
} from '@/actions/App/Http/Controllers/AssessmentController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import { gradeStyles } from '@/lib/grade';
import type { Grade } from '@/lib/grade';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type StudentRow = {
    id: number;
    name: string;
    nis: string;
    class: string | null;
    industry: string | null;
    scored: number;
    avg: number | null;
    grade: Grade | null;
};

type AssessmentsIndexProps = {
    students: Paginated<StudentRow>;
    filters: { search: string };
    aspectTotal: number;
};

export default function AssessmentsIndex({
    students,
    filters,
    aspectTotal,
}: AssessmentsIndexProps) {
    const [search, setSearch] = useState(filters.search);

    return (
        <AppLayout title="Rekap Penilaian">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-base font-bold text-ink">
                        Rekap penilaian siswa
                    </h2>
                    <p className="text-sm text-muted">
                        {students.total} siswa · {aspectTotal} aspek penilaian
                    </p>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            index.url(),
                            { search },
                            {
                                preserveState: true,
                                replace: true,
                                preserveScroll: true,
                            },
                        );
                    }}
                    className="mt-5"
                >
                    <label className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted">
                        <Search className="size-4" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama atau NIS…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {students.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <ClipboardList className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada siswa
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Kelas
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Aspek dinilai
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Rata-rata
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {students.data.map((student) => (
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
                                        <td className="py-3 text-ink/80">
                                            {student.scored} / {aspectTotal}
                                        </td>
                                        <td className="py-3">
                                            {student.avg === null ||
                                            student.grade === null ? (
                                                <span className="text-sm text-muted">
                                                    Belum dinilai
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="font-semibold text-ink">
                                                        {student.avg}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            'inline-flex rounded-full px-2 py-0.5 text-xs font-bold',
                                                            gradeStyles[
                                                                student.grade
                                                            ],
                                                        )}
                                                    >
                                                        {student.grade}
                                                    </span>
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Link
                                                href={show.url(student.id)}
                                                className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-canvas"
                                            >
                                                Lihat / Nilai
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination meta={students} />
            </section>
        </AppLayout>
    );
}
