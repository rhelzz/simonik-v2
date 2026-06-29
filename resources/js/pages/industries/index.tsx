import { Link, router } from '@inertiajs/react';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/IndustryController';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type IndustryRow = {
    id: number;
    name: string;
    bidang: string;
    alamat: string;
    email: string | null;
    guru: string | null;
    pembimbing: string | null;
    students_count: number;
};

type IndustriesIndexProps = {
    industries: Paginated<IndustryRow>;
    filters: { search: string };
};

export default function IndustriesIndex({
    industries,
    filters,
}: IndustriesIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function applyFilters(next: { search?: string }) {
        router.get(
            index.url(),
            { search: next.search ?? search },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    function remove(industry: IndustryRow) {
        if (
            confirm(
                `Hapus industri ${industry.name}? Akun industri beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(industry.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Data Industri">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar industri PKL
                        </h2>
                        <p className="text-sm text-muted">
                            {industries.total} industri terdaftar
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah industri
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
                            placeholder="Cari nama industri…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {/* Table */}
                {industries.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Building2 className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada industri
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau tambah industri baru.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Bidang
                                    </th>
                                    <th className="pb-3 font-semibold">Guru</th>
                                    <th className="pb-3 font-semibold">
                                        Pembimbing
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
                                {industries.data.map((industry) => (
                                    <tr key={industry.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {industry.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {industry.email ?? '—'}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {industry.bidang}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {industry.guru ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {industry.pembimbing ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {industry.students_count}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={edit.url(industry.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${industry.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(industry)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${industry.name}`}
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
                {industries.last_page > 1 && (
                    <div className="mt-5 flex items-center justify-between">
                        <p className="text-xs text-muted">
                            Hal. {industries.current_page} dari{' '}
                            {industries.last_page}
                        </p>
                        <div className="flex items-center gap-1">
                            <PageLink
                                url={industries.links[0]?.url ?? null}
                                ariaLabel="Sebelumnya"
                            >
                                <ChevronLeft className="size-4" />
                            </PageLink>
                            {industries.links.slice(1, -1).map((link, i) => (
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
                                    industries.links[
                                        industries.links.length - 1
                                    ]?.url ?? null
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
