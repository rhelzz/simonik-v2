import { Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, School, Search, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
    show,
    exportMethod,
    importMethod,
    template,
} from '@/actions/App/Http/Controllers/ClassController';
import { ImportExportBar } from '@/components/import-export-bar';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ClassRow = {
    id: number;
    name: string;
    slug: string;
    departemen: string | null;
    departemen_id: number;
    students_count: number;
};

type ClassesIndexProps = {
    classes: Paginated<ClassRow>;
    filters: { search: string };
};

export default function ClassesIndex({ classes, filters }: ClassesIndexProps) {
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

    function remove(row: ClassRow) {
        if (confirm(`Hapus kelas ${row.name}?`)) {
            router.delete(destroy.url(row.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Kelas">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar kelas
                        </h2>
                        <p className="text-sm text-muted">
                            {classes.total} kelas terdaftar
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportExportBar
                            exportUrl={exportMethod.url()}
                            templateUrl={template.url()}
                            importUrl={importMethod.url()}
                            entityLabel="kelas"
                        />
                        <Link
                            href={create.url()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="size-4" />
                            Tambah kelas
                        </Link>
                    </div>
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
                            placeholder="Cari kelas…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </form>

                    {filters.search && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>{classes.total} hasil · 1 filter aktif</span>
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

                {classes.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <School className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada kelas
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah kelas baru.
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
                                        Kelas
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Jurusan
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
                                {classes.data.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="group transition-colors hover:bg-canvas/50"
                                    >
                                        <td className="py-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                                                    <School className="size-4" />
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-ink">
                                                        {row.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted">
                                                        {row.slug}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {row.departemen ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {row.students_count}
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                <Link
                                                    href={show.url(row.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Lihat ${row.name}`}
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <Link
                                                    href={edit.url(row.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Edit ${row.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(row)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${row.name}`}
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

                <Pagination meta={classes} />
            </section>
        </AppLayout>
    );
}
