import { Link, router } from '@inertiajs/react';
import { CalendarRange, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/PeriodController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type PeriodRow = {
    id: number;
    name_period: string;
    start_period: string | null;
    end_period: string | null;
    students_count: number;
};

type PeriodsIndexProps = {
    periods: Paginated<PeriodRow>;
    filters: { search: string };
};

export default function PeriodsIndex({ periods, filters }: PeriodsIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function applyFilters(nextSearch: string) {
        router.get(
            index.url(),
            { search: nextSearch },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    function resetFilters() {
        setSearch('');
        applyFilters('');
    }

    function remove(period: PeriodRow) {
        if (confirm(`Hapus periode ${period.name_period}?`)) {
            router.delete(destroy.url(period.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Periode PKL">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Gelombang / periode PKL
                        </h2>
                        <p className="text-sm text-muted">
                            {periods.total} periode terdaftar
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah periode
                    </Link>
                </div>

                {/* Filters */}
                <div className="mt-5 space-y-3">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            applyFilters(search);
                        }}
                        className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
                    >
                        <Search className="size-4" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari periode…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </form>

                    {filters.search && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>{periods.total} hasil · 1 filter aktif</span>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-primary-soft hover:text-primary"
                            >
                                <X className="size-3" />
                                Reset filter
                            </button>
                        </div>
                    )}
                </div>

                {periods.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <CalendarRange className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada periode
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah periode baru.
                        </p>
                        {filters.search && (
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                            >
                                <X className="size-3" />
                                Reset filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 pl-2 font-semibold">
                                        Periode
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Mulai
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Selesai
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pr-2 pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {periods.data.map((period) => (
                                    <tr
                                        key={period.id}
                                        className="group transition-colors hover:bg-canvas/50"
                                    >
                                        <td className="py-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                                                    <CalendarRange className="size-4" />
                                                </span>
                                                <p className="truncate font-semibold text-ink">
                                                    {period.name_period}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {period.start_period ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {period.end_period ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {period.students_count}
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                <Link
                                                    href={edit.url(period.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Edit ${period.name_period}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(period)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${period.name_period}`}
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination meta={periods} />
            </section>
        </AppLayout>
    );
}
