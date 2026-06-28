import { Link, router } from '@inertiajs/react';
import {
    BadgeCheck,
    Clock,
    NotebookPen,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/ActivityController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ActivityRow = {
    id: number;
    judul: string;
    date: string;
    start_time: string;
    end_time: string;
    tools: string;
    verified: boolean;
};

type ActivitiesIndexProps = {
    activities: Paginated<ActivityRow>;
    filters: { search: string };
};

export default function ActivitiesIndex({
    activities,
    filters,
}: ActivitiesIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function remove(activity: ActivityRow) {
        if (confirm(`Hapus jurnal "${activity.judul}"?`)) {
            router.delete(destroy.url(activity.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Jurnal Saya">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Jurnal kegiatan harian
                        </h2>
                        <p className="text-sm text-muted">
                            {activities.total} jurnal tercatat
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah jurnal
                    </Link>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            index.url(),
                            { search },
                            {
                                preserveState: true,
                                replace: true,
                                preserveScroll: true,
                            },
                        );
                    }}
                    className="mt-5"
                >
                    <label className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted">
                        <Search className="size-4" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari judul kegiatan…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {activities.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <NotebookPen className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada jurnal
                        </p>
                        <p className="text-sm text-muted">
                            Catat kegiatan PKL harianmu di sini.
                        </p>
                    </div>
                ) : (
                    <ul className="mt-4 space-y-3">
                        {activities.data.map((activity) => (
                            <li
                                key={activity.id}
                                className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="truncate font-semibold text-ink">
                                            {activity.judul}
                                        </p>
                                        {activity.verified && (
                                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-positive/15 px-2 py-0.5 text-xs font-semibold text-positive">
                                                <BadgeCheck className="size-3" />
                                                Terverifikasi
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 flex items-center gap-3 text-xs text-muted">
                                        <span>{activity.date}</span>
                                        <span className="inline-flex items-center gap-1">
                                            <Clock className="size-3" />
                                            {activity.start_time}–
                                            {activity.end_time}
                                        </span>
                                        <span>· {activity.tools}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 self-end sm:self-auto">
                                    <Link
                                        href={edit.url(activity.id)}
                                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                        aria-label={`Edit ${activity.judul}`}
                                    >
                                        <Pencil className="size-4" />
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => remove(activity)}
                                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                        aria-label={`Hapus ${activity.judul}`}
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <Pagination meta={activities} />
            </section>
        </AppLayout>
    );
}
