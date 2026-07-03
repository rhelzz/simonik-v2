import { Link, router } from '@inertiajs/react';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    Eye,
    GraduationCap,
    ListFilter,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserRoundX,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    create,
    destroy,
    edit,
    index,
    show,
} from '@/actions/App/Http/Controllers/StudentController';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type StatusPkl = 'belum' | 'proses' | 'selesai';

type StudentRow = {
    id: number;
    name: string;
    nis: string;
    gender: string;
    status_pkl: StatusPkl;
    class: string | null;
    industri: string | null;
    email: string | null;
    image: string | null;
};

type NamedOption = { id: number; name: string };

type StudentsIndexProps = {
    students: Paginated<StudentRow>;
    classes: NamedOption[];
    industries: NamedOption[];
    filters: {
        search: string;
        class_id: number | null;
        industri_id: number | null;
        status_pkl: StatusPkl | null;
    };
};

const statusStyles: Record<StatusPkl, string> = {
    belum: 'bg-canvas text-muted',
    proses: 'bg-warning/15 text-warning',
    selesai: 'bg-positive/15 text-positive',
};

const statusLabels: Record<StatusPkl, string> = {
    belum: 'Belum mulai',
    proses: 'Berjalan',
    selesai: 'Selesai',
};

const statusDot: Record<StatusPkl, string> = {
    belum: 'bg-muted',
    proses: 'bg-warning',
    selesai: 'bg-positive',
};

/** Small colored dot used inside the status filter dropdown. */
function Dot({ className }: { className: string }) {
    return <span className={cn('block size-2 rounded-full', className)} />;
}

export default function StudentsIndex({
    students,
    classes,
    industries,
    filters,
}: StudentsIndexProps) {
    const [search, setSearch] = useState(filters.search);

    type FilterPatch = {
        search?: string;
        class_id?: string;
        industri_id?: string;
        status_pkl?: string;
    };

    function applyFilters(next: FilterPatch) {
        router.get(
            index.url(),
            {
                search: next.search ?? search,
                class_id: next.class_id ?? filters.class_id ?? '',
                industri_id: next.industri_id ?? filters.industri_id ?? '',
                status_pkl: next.status_pkl ?? filters.status_pkl ?? '',
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

    const classOptions: SelectOption[] = [
        { value: '', label: 'Semua kelas' },
        ...classes.map((cls) => ({ value: String(cls.id), label: cls.name })),
    ];

    const industryOptions: SelectOption[] = [
        { value: '', label: 'Semua industri' },
        ...industries.map((ind) => ({
            value: String(ind.id),
            label: ind.name,
        })),
    ];

    const statusOptions: SelectOption[] = [
        { value: '', label: 'Semua status' },
        ...(Object.keys(statusLabels) as StatusPkl[]).map((key) => ({
            value: key,
            label: statusLabels[key],
            hint: <Dot className={statusDot[key]} />,
        })),
    ];

    const activeCount =
        (filters.class_id ? 1 : 0) +
        (filters.industri_id ? 1 : 0) +
        (filters.status_pkl ? 1 : 0) +
        (filters.search ? 1 : 0);

    function remove(student: StudentRow) {
        if (
            confirm(
                `Hapus siswa ${student.name}? Akun login beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(student.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Data Siswa">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar siswa PKL
                        </h2>
                        <p className="text-sm text-muted">
                            {students.total} siswa terdaftar
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah siswa
                    </Link>
                </div>

                {/* Filters */}
                <div className="mt-5 space-y-3">
                    <div className="flex flex-col gap-3 lg:flex-row">
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
                                placeholder="Cari nama atau NIS…"
                                className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                            />
                        </form>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-xl">
                            <Select
                                ariaLabel="Filter kelas"
                                value={String(filters.class_id ?? '')}
                                options={classOptions}
                                onChange={(value) =>
                                    applyFilters({ class_id: value })
                                }
                                icon={<GraduationCap className="size-4" />}
                                placeholder="Semua kelas"
                            />
                            <Select
                                ariaLabel="Filter industri"
                                value={String(filters.industri_id ?? '')}
                                options={industryOptions}
                                onChange={(value) =>
                                    applyFilters({ industri_id: value })
                                }
                                icon={<Building2 className="size-4" />}
                                placeholder="Semua industri"
                            />
                            <Select
                                ariaLabel="Filter status PKL"
                                value={filters.status_pkl ?? ''}
                                options={statusOptions}
                                onChange={(value) =>
                                    applyFilters({ status_pkl: value })
                                }
                                icon={<ListFilter className="size-4" />}
                                placeholder="Semua status"
                            />
                        </div>
                    </div>

                    {activeCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>
                                {students.total} hasil · {activeCount} filter
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
                {students.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <UserRoundX className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada siswa
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah siswa baru.
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
                        <table className="w-full min-w-160 border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-line text-xs font-semibold tracking-wide text-muted uppercase">
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
                                        Status PKL
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {students.data.map((student) => (
                                    <tr
                                        key={student.id}
                                        className="group transition-colors hover:bg-canvas/50"
                                    >
                                        <td className="py-3 pl-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    name={student.name}
                                                    image={student.image}
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-ink">
                                                        {student.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted">
                                                        NIS {student.nis}
                                                        {student.email
                                                            ? ` · ${student.email}`
                                                            : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.class ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.industri ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    statusStyles[
                                                        student.status_pkl
                                                    ],
                                                )}
                                            >
                                                <Dot
                                                    className={
                                                        statusDot[
                                                            student.status_pkl
                                                        ]
                                                    }
                                                />
                                                {
                                                    statusLabels[
                                                        student.status_pkl
                                                    ]
                                                }
                                            </span>
                                        </td>
                                        <td className="py-3 pr-2">
                                            <div className="flex items-center justify-end gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                                                <Link
                                                    href={show.url(student.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Lihat detail ${student.name}`}
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <Link
                                                    href={edit.url(student.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-primary-soft hover:text-primary"
                                                    aria-label={`Edit ${student.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(student)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${student.name}`}
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

                {/* Pagination */}
                {students.last_page > 1 && (
                    <div className="mt-5 flex items-center justify-between">
                        <p className="text-xs text-muted">
                            Hal. {students.current_page} dari{' '}
                            {students.last_page}
                        </p>
                        <div className="flex items-center gap-1">
                            <PageLink
                                url={students.links[0]?.url ?? null}
                                ariaLabel="Sebelumnya"
                            >
                                <ChevronLeft className="size-4" />
                            </PageLink>
                            {students.links.slice(1, -1).map((link, i) => (
                                <PageLink
                                    key={i}
                                    url={link.url}
                                    active={link.active}
                                >
                                    {link.label}
                                </PageLink>
                            ))}
                            <PageLink
                                url={
                                    students.links[students.links.length - 1]
                                        ?.url ?? null
                                }
                                ariaLabel="Berikutnya"
                            >
                                <ChevronRight className="size-4" />
                            </PageLink>
                        </div>
                    </div>
                )}
            </section>
        </AppLayout>
    );
}

/** Round student avatar — photo when available, otherwise colored initials. */
function Avatar({ name, image }: { name: string; image: string | null }) {
    if (image) {
        return (
            <img
                src={image}
                alt={name}
                className="size-9 shrink-0 rounded-full object-cover"
            />
        );
    }

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

function PageLink({
    url,
    active = false,
    ariaLabel,
    children,
}: {
    url: string | null;
    active?: boolean;
    ariaLabel?: string;
    children: ReactNode;
}) {
    const className = cn(
        'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-medium',
        active ? 'bg-primary text-white' : 'text-ink/80 hover:bg-canvas',
        !url && 'pointer-events-none opacity-40',
    );

    if (!url) {
        return (
            <span className={className} aria-label={ariaLabel}>
                {children}
            </span>
        );
    }

    return (
        <Link
            href={url}
            preserveScroll
            aria-label={ariaLabel}
            className={className}
        >
            {children}
        </Link>
    );
}
