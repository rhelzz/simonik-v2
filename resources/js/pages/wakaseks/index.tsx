import { Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search, ShieldCheck, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
    exportMethod,
    importMethod,
    template,
} from '@/actions/App/Http/Controllers/WakasekController';
import { ImportExportBar } from '@/components/import-export-bar';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Wakasek = {
    id: number;
    name: string;
    email: string;
    created_at: string | null;
};

type WakaseksIndexProps = {
    wakaseks: Paginated<Wakasek>;
    filters: { search: string };
};

/** Round avatar built from initials. */
function Avatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();

    return (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            {initials}
        </span>
    );
}

export default function WakaseksIndex({
    wakaseks,
    filters,
}: WakaseksIndexProps) {
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

    function remove(wakasek: Wakasek) {
        if (
            confirm(
                `Hapus akun wakasek ${wakasek.name}? Akun login beserta aksesnya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(wakasek.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Data Wakasek">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Wakasek Humas / Hubin
                        </h2>
                        <p className="text-sm text-muted">
                            {wakaseks.total} akun wakasek terdaftar
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportExportBar
                            exportUrl={exportMethod.url()}
                            templateUrl={template.url()}
                            importUrl={importMethod.url()}
                            entityLabel="wakasek"
                        />
                        <Link
                            href={create.url()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="size-4" />
                            Tambah wakasek
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
                            placeholder="Cari nama atau email…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </form>

                    {filters.search && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>{wakaseks.total} hasil</span>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-primary-soft hover:text-primary"
                            >
                                <X className="size-3" />
                                Reset pencarian
                            </button>
                        </div>
                    )}
                </div>

                {/* Table */}
                {wakaseks.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <ShieldCheck className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada akun wakasek
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah wakasek baru.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Wakasek
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Terdaftar
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {wakaseks.data.map((wakasek) => (
                                    <tr
                                        key={wakasek.id}
                                        className="group transition-colors hover:bg-canvas/50"
                                    >
                                        <td className="py-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={wakasek.name} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-ink">
                                                        {wakasek.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted">
                                                        {wakasek.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {wakasek.created_at ?? '—'}
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                <Link
                                                    href={edit.url(wakasek.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Edit ${wakasek.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(wakasek)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${wakasek.name}`}
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

                <Pagination meta={wakaseks} />
            </section>
        </AppLayout>
    );
}
