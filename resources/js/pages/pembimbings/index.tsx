import { Link, router } from '@inertiajs/react';
import {
    Eye,
    HardHat,
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
    show,
    exportMethod,
    importMethod,
    template,
} from '@/actions/App/Http/Controllers/PembimbingController';
import { ImportExportBar } from '@/components/import-export-bar';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Pembimbing = {
    id: number;
    name: string;
    no_hp: string;
    gender: string | null;
    email: string | null;
    industry: string | null;
    students_count: number;
};

type PembimbingsIndexProps = {
    pembimbings: Paginated<Pembimbing>;
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

export default function PembimbingsIndex({
    pembimbings,
    filters,
}: PembimbingsIndexProps) {
    const [search, setSearch] = useState(filters.search);

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

    function remove(pembimbing: Pembimbing) {
        if (
            confirm(
                `Hapus pembimbing ${pembimbing.name}? Akun login beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(pembimbing.id), { preserveScroll: true });
        }
    }

    const genderOptions: SelectOption[] = [
        { value: '', label: 'Semua jenis kelamin' },
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' },
    ];

    const activeCount = (filters.gender ? 1 : 0) + (filters.search ? 1 : 0);

    return (
        <AppLayout title="Pembimbing Industri">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar pembimbing industri
                        </h2>
                        <p className="text-sm text-muted">
                            {pembimbings.total} pembimbing terdaftar
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportExportBar
                            exportUrl={exportMethod.url()}
                            templateUrl={template.url()}
                            importUrl={importMethod.url()}
                            entityLabel="pembimbing"
                        />
                        <Link
                            href={create.url()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="size-4" />
                            Tambah pembimbing
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
                                placeholder="Cari nama atau no. HP…"
                                className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                            />
                        </form>
                        <Select
                            ariaLabel="Filter jenis kelamin"
                            className="sm:w-64"
                            value={filters.gender ?? ''}
                            options={genderOptions}
                            onChange={(value) =>
                                applyFilters({ gender: value })
                            }
                            icon={<Venus className="size-4" />}
                            placeholder="Semua jenis kelamin"
                        />
                    </div>

                    {activeCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>
                                {pembimbings.total} hasil · {activeCount} filter
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
                {pembimbings.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <HardHat className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada pembimbing
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah pembimbing baru.
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
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Pembimbing
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {pembimbings.data.map((pembimbing) => (
                                    <tr
                                        key={pembimbing.id}
                                        className="group transition-colors hover:bg-canvas/50"
                                    >
                                        <td className="py-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={pembimbing.name}
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-ink">
                                                        {pembimbing.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted">
                                                        {pembimbing.no_hp}
                                                        {pembimbing.email
                                                            ? ` · ${pembimbing.email}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {pembimbing.industry ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink/70">
                                                <UsersRound className="size-3.5" />
                                                {pembimbing.students_count}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                <Link
                                                    href={show.url(
                                                        pembimbing.id,
                                                    )}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Lihat detail ${pembimbing.name}`}
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <Link
                                                    href={edit.url(
                                                        pembimbing.id,
                                                    )}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Edit ${pembimbing.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(pembimbing)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${pembimbing.name}`}
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

                <Pagination meta={pembimbings} />
            </section>
        </AppLayout>
    );
}
