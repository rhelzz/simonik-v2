import { Link, router } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserRoundX,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/StudentController';
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
    email: string | null;
    image: string | null;
};

type ClassOption = { id: number; name: string };

type StudentsIndexProps = {
    students: Paginated<StudentRow>;
    classes: ClassOption[];
    filters: { search: string; class_id: number | null };
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

export default function StudentsIndex({
    students,
    classes,
    filters,
}: StudentsIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function applyFilters(next: { search?: string; class_id?: string }) {
        router.get(
            index.url(),
            {
                search: next.search ?? search,
                class_id: next.class_id ?? filters.class_id ?? '',
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

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
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        applyFilters({ search });
                    }}
                    className="mt-5 flex flex-col gap-3 sm:flex-row"
                >
                    <label className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted">
                        <Search className="size-4" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama atau NIS…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                    <select
                        value={filters.class_id ?? ''}
                        onChange={(event) =>
                            applyFilters({ class_id: event.target.value })
                        }
                        className="rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink focus:outline-none"
                    >
                        <option value="">Semua kelas</option>
                        {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                                {cls.name}
                            </option>
                        ))}
                    </select>
                </form>

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
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Kelas
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
                                    <tr key={student.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {student.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                NIS {student.nis}
                                                {student.email
                                                    ? ` · ${student.email}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.class ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    statusStyles[
                                                        student.status_pkl
                                                    ],
                                                )}
                                            >
                                                {
                                                    statusLabels[
                                                        student.status_pkl
                                                    ]
                                                }
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={edit.url(student.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
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
