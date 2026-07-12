import { Link, router } from '@inertiajs/react';
import {
    Building2,
    Eye,
    GraduationCap,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
    UsersRound,
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
} from '@/actions/App/Http/Controllers/TeacherController';
import { ImportExportBar } from '@/components/import-export-bar';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Teacher = {
    id: number;
    name: string;
    no_hp: string;
    email: string | null;
    departemen: string | null;
    departemen_id: number;
    industries_count: number;
    students_count: number;
};

type NamedOption = { id: number; name: string };

type TeachersIndexProps = {
    teachers: Paginated<Teacher>;
    departemens: NamedOption[];
    filters: { search: string; departemen_id: number | null };
};

/** Round teacher avatar built from initials. */
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

export default function TeachersIndex({
    teachers,
    departemens,
    filters,
}: TeachersIndexProps) {
    const [search, setSearch] = useState(filters.search);

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

    function remove(teacher: Teacher) {
        if (
            confirm(
                `Hapus guru ${teacher.name}? Akun login beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(teacher.id), { preserveScroll: true });
        }
    }

    const departemenOptions: SelectOption[] = [
        { value: '', label: 'Semua jurusan' },
        ...departemens.map((dept) => ({
            value: String(dept.id),
            label: dept.name,
        })),
    ];

    const activeCount =
        (filters.departemen_id ? 1 : 0) + (filters.search ? 1 : 0);

    return (
        <AppLayout title="Guru Pembimbing">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar guru pembimbing
                        </h2>
                        <p className="text-sm text-muted">
                            {teachers.total} guru terdaftar
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ImportExportBar
                            exportUrl={exportMethod.url()}
                            templateUrl={template.url()}
                            importUrl={importMethod.url()}
                            entityLabel="guru"
                        />
                        <Link
                            href={create.url()}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="size-4" />
                            Tambah guru
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
                            ariaLabel="Filter jurusan"
                            className="sm:w-64"
                            value={String(filters.departemen_id ?? '')}
                            options={departemenOptions}
                            onChange={(value) =>
                                applyFilters({ departemen_id: value })
                            }
                            icon={<GraduationCap className="size-4" />}
                            placeholder="Semua jurusan"
                        />
                    </div>

                    {activeCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>
                                {teachers.total} hasil · {activeCount} filter
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
                {teachers.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Users className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada guru
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah guru baru.
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
                                    <th className="pb-3 font-semibold">Guru</th>
                                    <th className="pb-3 font-semibold">
                                        Jurusan
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
                                {teachers.data.map((teacher) => (
                                    <tr
                                        key={teacher.id}
                                        className="group transition-colors hover:bg-canvas/50"
                                    >
                                        <td className="py-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar name={teacher.name} />
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-ink">
                                                        {teacher.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted">
                                                        {teacher.no_hp}
                                                        {teacher.email
                                                            ? ` · ${teacher.email}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {teacher.departemen ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink/70">
                                                <Building2 className="size-3.5" />
                                                {teacher.industries_count}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-ink/70">
                                                <UsersRound className="size-3.5" />
                                                {teacher.students_count}
                                            </span>
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                <Link
                                                    href={show.url(teacher.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Lihat detail ${teacher.name}`}
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <Link
                                                    href={edit.url(teacher.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Edit ${teacher.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(teacher)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${teacher.name}`}
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

                <Pagination meta={teachers} />
            </section>
        </AppLayout>
    );
}
