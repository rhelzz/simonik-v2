import { Link, router } from '@inertiajs/react';
import { BadgeCheck, ClipboardList, Eye, Search } from 'lucide-react';
import { useState } from 'react';
import {
    index,
    show,
} from '@/actions/App/Http/Controllers/ActivityMonitorController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ActivityRow = {
    id: number;
    judul: string;
    date: string;
    student: string | null;
    class: string | null;
    tools: string;
    verified: boolean;
};

type MonitorIndexProps = {
    activities: Paginated<ActivityRow>;
    filters: { search: string; date: string | null };
};

export default function ActivityMonitorIndex({
    activities,
    filters,
}: MonitorIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function applyFilters(next: { search?: string; date?: string }) {
        router.get(
            index.url(),
            {
                search: next.search ?? search,
                date: next.date ?? filters.date ?? '',
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    return (
        <AppLayout title="Kegiatan Siswa">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div>
                    <h2 className="text-base font-bold text-ink">
                        Pemantauan jurnal kegiatan
                    </h2>
                    <p className="text-sm text-muted">
                        {activities.total} jurnal dari siswa bimbingan
                    </p>
                </div>

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
                            placeholder="Cari nama siswa…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                    <input
                        type="date"
                        value={filters.date ?? ''}
                        onChange={(event) =>
                            applyFilters({ date: event.target.value })
                        }
                        className="rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink focus:outline-none"
                    />
                </form>

                {activities.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <ClipboardList className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada jurnal
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian atau filter tanggal.
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
                                        Kegiatan
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Tanggal
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {activities.data.map((activity) => (
                                    <tr key={activity.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {activity.student ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {activity.class ?? '—'}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {activity.judul}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {activity.date}
                                        </td>
                                        <td className="py-3">
                                            {activity.verified ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-positive/15 px-2.5 py-1 text-xs font-semibold text-positive">
                                                    <BadgeCheck className="size-3" />
                                                    Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-canvas px-2.5 py-1 text-xs font-semibold text-muted">
                                                    Belum
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex justify-end">
                                                <Link
                                                    href={show.url(activity.id)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary-soft"
                                                >
                                                    <Eye className="size-4" />
                                                    Lihat
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination meta={activities} />
            </section>
        </AppLayout>
    );
}
