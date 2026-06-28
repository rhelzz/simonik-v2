import { Link, router } from '@inertiajs/react';
import { BadgeCheck, Eye, Fingerprint, Search } from 'lucide-react';
import { useState } from 'react';
import {
    index,
    show,
} from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import { statusBadgeClass, statusLabel } from '@/lib/attendance';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type AttendanceRow = {
    id: number;
    date: string;
    status: string | null;
    arrivalTime: string | null;
    departureTime: string | null;
    student: string | null;
    class: string | null;
    verified: boolean;
};

type MonitorIndexProps = {
    attendances: Paginated<AttendanceRow>;
    statuses: string[];
    filters: { search: string; date: string | null; status: string | null };
};

export default function AttendanceMonitorIndex({
    attendances,
    statuses,
    filters,
}: MonitorIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function applyFilters(next: {
        search?: string;
        date?: string;
        status?: string;
    }) {
        router.get(
            index.url(),
            {
                search: next.search ?? search,
                date: next.date ?? filters.date ?? '',
                status: next.status ?? filters.status ?? '',
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    return (
        <AppLayout title="Absensi Siswa">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div>
                    <h2 className="text-base font-bold text-ink">
                        Pemantauan kehadiran
                    </h2>
                    <p className="text-sm text-muted">
                        {attendances.total} catatan kehadiran siswa bimbingan
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
                    <select
                        value={filters.status ?? ''}
                        onChange={(event) =>
                            applyFilters({ status: event.target.value })
                        }
                        className="rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink focus:outline-none"
                    >
                        <option value="">Semua status</option>
                        {statuses.map((status) => (
                            <option key={status} value={status}>
                                {statusLabel(status)}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={filters.date ?? ''}
                        onChange={(event) =>
                            applyFilters({ date: event.target.value })
                        }
                        className="rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink focus:outline-none"
                    />
                </form>

                {attendances.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Fingerprint className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada kehadiran
                        </p>
                        <p className="text-sm text-muted">
                            Sesuaikan pencarian, status, atau filter tanggal.
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
                                        Tanggal
                                    </th>
                                    <th className="pb-3 font-semibold">Jam</th>
                                    <th className="pb-3 font-semibold">
                                        Status
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Verifikasi
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {attendances.data.map((attendance) => (
                                    <tr key={attendance.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {attendance.student ?? '—'}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {attendance.class ?? '—'}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {attendance.date}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {attendance.arrivalTime ?? '—'}
                                            {attendance.departureTime
                                                ? ` – ${attendance.departureTime}`
                                                : ''}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    statusBadgeClass(
                                                        attendance.status,
                                                    ),
                                                )}
                                            >
                                                {statusLabel(attendance.status)}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            {attendance.verified ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-positive">
                                                    <BadgeCheck className="size-3.5" />
                                                    Terverifikasi
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted">
                                                    Belum
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex justify-end">
                                                <Link
                                                    href={show.url(
                                                        attendance.id,
                                                    )}
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

                <Pagination meta={attendances} />
            </section>
        </AppLayout>
    );
}
