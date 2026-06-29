import { Link, router } from '@inertiajs/react';
import { Search, UsersRound } from 'lucide-react';
import { useState } from 'react';
import {
    classes,
    index,
    show,
    students,
} from '@/actions/App/Http/Controllers/JournalMonitorController';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type StudentRow = {
    id: number;
    name: string;
    nis: string;
    total: number;
    pending: number;
};

export default function JournalMonitorStudents({
    departemen,
    class: klass,
    students: rows,
    filters,
}: {
    departemen: { id: number; name: string } | null;
    class: { id: number; name: string };
    students: Paginated<StudentRow>;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search);

    return (
        <AppLayout title="Data Jurnal">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <Breadcrumb
                    items={[
                        { label: 'Data Jurnal', href: index.url() },
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
                    Murid kelas {klass.name}
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
                        <UsersRound className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada murid
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-128 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Murid
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Jumlah jurnal
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Belum diverifikasi
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
                                            {student.total}
                                        </td>
                                        <td className="py-3">
                                            {student.pending > 0 ? (
                                                <span className="inline-flex rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning">
                                                    {student.pending} menunggu
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Link
                                                href={show.url(student.id)}
                                                prefetch
                                                className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-canvas"
                                            >
                                                Lihat jurnal
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
