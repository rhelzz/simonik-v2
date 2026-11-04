import { Link, router } from '@inertiajs/react';
import {
    Pencil,
    Plus,
    Search,
    Trash2,
    UsersRound,
    Venus,
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
} from '@/actions/App/Http/Controllers/ParentController';
import { ImportExportBar } from '@/components/import-export-bar';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Parent = {
    id: number;
    nama: string;
    gender: string | null;
    occupation: string | null;
    phoneNumber: string | null;
    email: string | null;
    students: string[];
};

type ParentsIndexProps = {
    parents: Paginated<Parent>;
    filters: { search: string; gender: string | null };
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

export default function ParentsIndex({ parents, filters }: ParentsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [selected, setSelected] = useState<number[]>([]);
    const [bulkOpen, setBulkOpen] = useState(false);

    const pageIds = parents.data.map((parent) => parent.id);
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

    function applyFilters(next: { search?: string; gender?: string }) {
        router.get(
            index.url(),
            {
                search: next.search ?? search,
                gender: next.gender ?? filters.gender ?? '',
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

    function remove(parent: Parent) {
        if (
            confirm(
                `Hapus orang tua ${parent.nama}? Akun login beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(parent.id), { preserveScroll: true });
        }
    }

    const genderOptions: SelectOption[] = [
        { value: '', label: 'Semua (Ayah/Ibu)' },
        { value: 'L', label: 'Ayah' },
        { value: 'P', label: 'Ibu' },
    ];

    const activeCount = (filters.gender ? 1 : 0) + (filters.search ? 1 : 0);

    return (
        <AppLayout title="Orang Tua">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar orang tua / wali
                        </h2>
                        <p className="text-sm text-muted">
                            {parents.total} orang tua terdaftar
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportExportBar
                            exportUrl={exportMethod.url()}
                            templateUrl={template.url()}
                            importUrl={importMethod.url()}
                            entityLabel="orang tua"
                        />
                        <Link
                            href={create.url()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="size-4" />
                            Tambah orang tua
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
                                placeholder="Cari nama, pekerjaan, atau no. HP…"
                                className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                            />
                        </form>
                        <Select
                            ariaLabel="Filter Ayah/Ibu"
                            className="sm:w-64"
                            value={filters.gender ?? ''}
                            options={genderOptions}
                            onChange={(value) =>
                                applyFilters({ gender: value })
                            }
                            icon={<Venus className="size-4" />}
                            placeholder="Semua (Ayah/Ibu)"
                        />
                    </div>

                    {activeCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>
                                {parents.total} hasil · {activeCount} filter
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
                {parents.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <UsersRound className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada orang tua
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah orang tua baru.
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
                                    orang tua dipilih di halaman ini
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
                                                aria-label="Pilih semua orang tua di halaman ini"
                                                className="size-4 cursor-pointer accent-primary"
                                            />
                                        </th>
                                        <th className="px-3 pb-3 font-semibold">
                                            Orang tua
                                        </th>
                                        <th className="px-3 pb-3 font-semibold">
                                            Ayah/Ibu
                                        </th>
                                        <th className="px-3 pb-3 font-semibold">
                                            Pekerjaan
                                        </th>
                                        <th className="px-3 pb-3 font-semibold">
                                            Anak
                                        </th>
                                        <th className="px-3 pb-3 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {parents.data.map((parent) => (
                                        <tr
                                            key={parent.id}
                                            className="group transition-colors hover:bg-canvas/50"
                                        >
                                            <td className="py-3 pl-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selected.includes(
                                                        parent.id,
                                                    )}
                                                    onChange={() =>
                                                        toggle(parent.id)
                                                    }
                                                    aria-label={`Pilih ${parent.nama}`}
                                                    className="size-4 cursor-pointer accent-primary"
                                                />
                                            </td>
                                            <td className="py-3 pr-3 pl-2">
                                                <div className="flex items-center gap-3">
                                                    <Avatar
                                                        name={parent.nama}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-ink">
                                                            {parent.nama}
                                                        </p>
                                                        <p className="truncate text-xs text-muted">
                                                            {parent.phoneNumber}
                                                            {parent.email
                                                                ? ` · ${parent.email}`
                                                                : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-ink/80">
                                                {parent.gender ?? (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-ink/80">
                                                {parent.occupation ?? (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                {parent.students.length ===
                                                0 ? (
                                                    <span className="text-muted">
                                                        —
                                                    </span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {parent.students.map(
                                                            (name, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="inline-flex rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink/70"
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
                                                            parent.id,
                                                        )}
                                                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                        aria-label={`Edit ${parent.nama}`}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            remove(parent)
                                                        }
                                                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                        aria-label={`Hapus ${parent.nama}`}
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

                <Pagination meta={parents} />
            </section>

            <Modal
                open={bulkOpen}
                onClose={() => setBulkOpen(false)}
                title="Hapus orang tua terpilih"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">
                        <span className="font-semibold text-ink">
                            {onPage.length} orang tua
                        </span>{' '}
                        akan dihapus beserta akun loginnya. Tindakan ini tidak
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
                            Hapus {onPage.length} orang tua
                        </button>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
