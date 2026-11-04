import { Link, router } from '@inertiajs/react';
import {
    GraduationCap,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserCog,
    X,
} from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
    exportMethod,
    importMethod,
    template,
    bulkDestroy,
} from '@/actions/App/Http/Controllers/KaprogController';
import { ImportExportBar } from '@/components/import-export-bar';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Kaprog = {
    id: number;
    name: string;
    email: string;
    departemens: string[];
    created_at: string | null;
};

type NamedOption = { id: number; name: string };

type KaprogsIndexProps = {
    kaprogs: Paginated<Kaprog>;
    departemens: NamedOption[];
    filters: { search: string; departemen_id: number | null };
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

export default function KaprogsIndex({
    kaprogs,
    departemens,
    filters,
}: KaprogsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkOpen, setBulkOpen] = useState(false);

    const pageIds = kaprogs.data.map((kaprog) => kaprog.id);
    const onPage = selected.filter((id) => pageIds.includes(id));
    const allChecked = pageIds.length > 0 && onPage.length === pageIds.length;
    const someChecked = onPage.length > 0 && !allChecked;

    function toggle(id: number) {
        setSelected((current) =>
            current.includes(id)
                ? current.filter((value) => value !== id)
                : [...current, id],
        );
    }

    function toggleAll() {
        setSelected(allChecked ? [] : pageIds);
    }

    function removeSelected() {
        router.delete(bulkDestroy.url(), {
            data: { ids: onPage },
            preserveScroll: true,
            onSuccess: () => {
                setSelected([]);
                setBulkOpen(false);
            },
        });
    }

    function applyFilters(next: { search?: string; departemen_id?: string }) {
        router.get(
            index.url(),
            {
                search: next.search ?? search,
                departemen_id:
                    next.departemen_id ?? filters.departemen_id ?? '',
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    function resetFilters() {
        setSearch('');
        router.get(
            index.url(),
            {},
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    function remove(kaprog: Kaprog) {
        if (
            confirm(
                `Hapus akun kepala program ${kaprog.name}? Akun login akan terhapus; program keahliannya akan dilepas (tidak ikut terhapus).`,
            )
        ) {
            router.delete(destroy.url(kaprog.id), { preserveScroll: true });
        }
    }

    const departemenOptions: SelectOption[] = [
        { value: '', label: 'Semua program' },
        ...departemens.map((dept) => ({
            value: String(dept.id),
            label: dept.name,
        })),
    ];

    const activeCount =
        (filters.departemen_id ? 1 : 0) + (filters.search ? 1 : 0);

    return (
        <AppLayout title="Data Kepala Program">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Kepala Program Keahlian
                        </h2>
                        <p className="text-sm text-muted">
                            {kaprogs.total} akun kaprog terdaftar
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportExportBar
                            exportUrl={exportMethod.url()}
                            templateUrl={template.url()}
                            importUrl={importMethod.url()}
                            entityLabel="kaprog"
                        />
                        <Link
                            href={create.url()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="size-4" />
                            Tambah kaprog
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-5 space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters({ search });
                            }}
                            className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
                        >
                            <Search className="size-4" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari nama atau email…"
                                className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                            />
                        </form>
                        <Select
                            ariaLabel="Filter program keahlian"
                            className="sm:w-64"
                            value={String(filters.departemen_id ?? '')}
                            options={departemenOptions}
                            onChange={(value) =>
                                applyFilters({ departemen_id: value })
                            }
                            icon={<GraduationCap className="size-4" />}
                            placeholder="Semua program"
                        />
                    </div>

                    {activeCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>
                                {kaprogs.total} hasil · {activeCount} filter
                                aktif
                            </span>
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

                {/* Table */}
                {kaprogs.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <UserCog className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada akun kaprog
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah kaprog baru.
                        </p>
                        {activeCount > 0 && (
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
                    <div className="mt-4 space-y-3">
                        {onPage.length > 0 && (
                            <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary-soft/40 px-4 py-2.5 text-sm">
                                <span className="font-medium text-ink">
                                    <strong className="font-bold text-primary">
                                        {onPage.length}
                                    </strong>{' '}
                                    kaprog dipilih di halaman ini
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelected([])}
                                        className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-ink"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setBulkOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                                    >
                                        <Trash2 className="size-4" />
                                        Hapus terpilih
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-lg border-collapse text-left text-sm">
                                <thead>
                                    <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                                        <th className="w-10 pb-3 pl-2">
                                            <input
                                                type="checkbox"
                                                checked={allChecked}
                                                ref={(node) => {
                                                    if (node) {
                                                        node.indeterminate =
                                                            someChecked;
                                                    }
                                                }}
                                                onChange={toggleAll}
                                                aria-label="Pilih semua kaprog di halaman ini"
                                                className="size-4 cursor-pointer accent-primary"
                                            />
                                        </th>
                                        <th className="px-3 pb-3 font-semibold">
                                            Kepala program
                                        </th>
                                        <th className="px-3 pb-3 font-semibold">
                                            Program keahlian
                                        </th>
                                        <th className="px-3 pb-3 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {kaprogs.data.map((kaprog) => (
                                        <tr
                                            key={kaprog.id}
                                            className="group transition-colors hover:bg-canvas/50"
                                        >
                                            <td className="py-3 pl-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(
                                                        kaprog.id,
                                                    )}
                                                    onChange={() =>
                                                        toggle(kaprog.id)
                                                    }
                                                    aria-label={`Pilih ${kaprog.name}`}
                                                    className="size-4 cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="py-3 pr-3 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={kaprog.name}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-ink">
                                                            {kaprog.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted">
                                                            {kaprog.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                {kaprog.departemens.length ===
                                                0 ? (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {kaprog.departemens.map(
                                                            (name) => (
                                                                <span
                                                                    key={name}
                                                                    className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"
                                                                >
                                                                    {name}
                                                                </span>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 pr-2 pl-3">
                                                <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                    <Link
                                                        href={edit.url(
                                                            kaprog.id,
                                                        )}
                                                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                        aria-label={`Edit ${kaprog.name}`}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            remove(kaprog)
                                                        }
                                                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                        aria-label={`Hapus ${kaprog.name}`}
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
                    </div>
                )}

                <Pagination meta={kaprogs} />
            </section>

            <Modal
                open={bulkOpen}
                onClose={() => setBulkOpen(false)}
                title="Hapus akun kepala program terpilih"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">
                        <span className="font-semibold text-ink">
                            {onPage.length} akun kepala program
                        </span>{' '}
                        akan dihapus beserta hak aksesnya. Tindakan ini tidak
                        bisa dibatalkan.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setBulkOpen(false)}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={removeSelected}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                        >
                            <Trash2 className="size-4" />
                            Hapus {onPage.length} kaprog
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
