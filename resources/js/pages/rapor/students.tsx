import { Link, router } from '@inertiajs/react';
import { FileText, Search } from 'lucide-react';
import { useState } from 'react';
import {
    classes,
    index,
    show,
    students,
} from '@/actions/App/Http/Controllers/RaporController';
import { Breadcrumb } from '@/components/ui/breadcrumb';
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
    industry: string | null;
    avg: number | null;
    grade: Grade | null;
    eligible: boolean;
};

type Props = {
    departemen: { id: number; name: string } | null;
    class: { id: number; name: string };
    students: Paginated<StudentRow>;
    filters: { search: string };
};

export default function RaporStudents({
    departemen,
    class: klass,
    students: rows,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search);

    return (
        <AppLayout title="Rapor Digital">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <Breadcrumb
                    items={[
                        { label: 'Rapor Digital', href: index.url() },
                        departemen
                            ? {
                                  label: departemen.name,
                                  href: classes.url(departemen.id),
                              }
                            : { label: '—' },
                        { label: klass.name },
                    ]}
                />

                <h2 className="mt-4 text-base font-bold text-ink">
                    Rapor kelas {klass.name}
                </h2>
                <p className="text-sm text-muted">{rows.total} murid</p>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            students.url(klass.id),
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

                {rows.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <FileText className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada murid
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Murid
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Nilai
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {rows.data.map((student) => (
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
                                            {student.industry ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            {student.avg !== null &&
                                            student.grade !== null ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <span className="font-bold text-ink">
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
                                            ) : (
                                                <span className="text-xs text-muted">
                                                    Belum dinilai
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Link
                                                href={show.url(student.id)}
                                                prefetch
                                                className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-canvas"
                                            >
                                                Lihat / Cetak
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination meta={rows} />
            </section>
        </AppLayout>
    );
}
