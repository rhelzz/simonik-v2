import { Link, router } from '@inertiajs/react';
import { Megaphone, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/AnnouncementController';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { ScopeNote } from '@/components/ui/scope-note';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type AnnouncementRow = {
    id: number;
    title: string;
    roleLabels: string[];
    author: string | null;
    startsAt: string;
    endsAt: string;
    status: 'tayang' | 'terjadwal' | 'berakhir';
    statusLabel: string;
};

const statusStyles: Record<string, string> = {
    tayang: 'bg-positive/15 text-positive',
    terjadwal: 'bg-warning/15 text-warning',
    berakhir: 'bg-canvas text-muted',
};

export default function AnnouncementIndex({
    announcements,
    filters,
    scopeLabel,
}: {
    announcements: Paginated<AnnouncementRow>;
    filters: { search: string };
    scopeLabel: string;
}) {
    const [search, setSearch] = useState(filters.search);
    const [deleting, setDeleting] = useState<number | null>(null);

    function applySearch(value: string) {
        setSearch(value);
        router.get(
            index.url(),
            { search: value },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <AppLayout title="Pengumuman">
            <Breadcrumb items={[{ label: 'Pengumuman' }]} />

            <section className="mt-4 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                            <Megaphone className="size-5" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-ink">
                                Pengumuman
                            </h2>
                            <p className="text-sm text-muted">
                                Tampil di dashboard role yang dituju selama
                                periode yang ditentukan.
                            </p>
                            <ScopeNote label={scopeLabel} />
                        </div>
                    </div>

                    <Link
                        href={create.url()}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Buat pengumuman
                    </Link>
                </div>

                <input
                    type="search"
                    value={search}
                    onChange={(event) => applySearch(event.target.value)}
                    placeholder="Cari judul…"
                    className="mt-4 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none sm:max-w-xs"
                />

                {announcements.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Megaphone className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada pengumuman
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[44rem] text-sm">
                            <thead>
                                <tr className="border-b border-line text-left text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                                    <th className="px-3 py-2.5">Judul</th>
                                    <th className="px-3 py-2.5">Ditujukan</th>
                                    <th className="px-3 py-2.5">Periode</th>
                                    <th className="px-3 py-2.5">Status</th>
                                    <th className="px-3 py-2.5 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {announcements.data.map((row) => (
                                    <tr key={row.id}>
                                        <td className="px-3 py-2.5">
                                            <p className="font-semibold text-ink">
                                                {row.title}
                                            </p>
                                            {row.author && (
                                                <p className="text-xs text-muted">
                                                    {row.author}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-wrap gap-1">
                                                {row.roleLabels.map((label) => (
                                                    <span
                                                        key={label}
                                                        className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary"
                                                    >
                                                        {label}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-muted">
                                            {row.startsAt} – {row.endsAt}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    statusStyles[row.status] ??
                                                        'bg-canvas text-muted',
                                                )}
                                            >
                                                {row.statusLabel}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex justify-end gap-1">
                                                <Link
                                                    href={edit.url(row.id)}
                                                    title="Ubah"
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    title="Hapus"
                                                    disabled={
                                                        deleting === row.id
                                                    }
                                                    onClick={() => {
                                                        if (
                                                            !window.confirm(
                                                                `Hapus pengumuman "${row.title}"?`,
                                                            )
                                                        ) {
                                                            return;
                                                        }

                                                        setDeleting(row.id);
                                                        router.delete(
                                                            destroy.url(row.id),
                                                            {
                                                                preserveScroll: true,
                                                                onFinish: () =>
                                                                    setDeleting(
                                                                        null,
                                                                    ),
                                                            },
                                                        );
                                                    }}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
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

                <Pagination meta={announcements} />
            </section>
        </AppLayout>
    );
}
