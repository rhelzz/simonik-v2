import { router } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Search, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { index } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { Pagination } from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';
import { ProxyAttendanceModal } from './proxy-attendance-modal';

export type RosterRow = {
    id: number;
    name: string;
    nis: string;
    class: string | null;
    industry: string | null;
    status: string;
    statusLabel: string;
    arrivalTime: string | null;
    departureTime: string | null;
    lateMinutes: number | null;
    mode: string | null;
    canCheckIn: boolean;
    canCheckOut: boolean;
};

export type RosterCategory = 'hadir' | 'terlambat' | 'alpha' | 'wfh';

type Filters = {
    tanggal: string;
    category: RosterCategory;
    search: string;
    industri: number | null;
};

type Props = {
    roster: Paginated<RosterRow>;
    summary: Record<RosterCategory, number>;
    filters: Filters;
    dateLabel: string;
    can: { proxyAttendance: boolean };
    industries: { id: number; name: string }[];
};

const categories: { value: RosterCategory; label: string }[] = [
    { value: 'hadir', label: 'Semua siswa' },
    { value: 'terlambat', label: 'Terlambat' },
    { value: 'alpha', label: 'Alpa' },
    { value: 'wfh', label: 'WFH' },
];

const statusStyles: Record<string, string> = {
    hadir: 'bg-positive/15 text-positive',
    masuk: 'bg-positive/15 text-positive',
    terlambat: 'bg-orange-500/15 text-orange-600',
    sakit: 'bg-warning/15 text-warning',
    izin: 'bg-warning/15 text-warning',
    libur: 'bg-canvas text-muted',
    alpha: 'bg-red-500/15 text-red-500',
    'belum-lengkap': 'bg-warning/15 text-warning',
};

export function DailyRoster({
    roster,
    summary,
    filters,
    dateLabel,
    can,
    industries,
}: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const [proxyType, setProxyType] = useState<'masuk' | 'pulang' | null>(null);
    const [search, setSearch] = useState(filters.search);

    const selectableRows = roster.data.filter(
        (row) => row.canCheckIn || row.canCheckOut,
    );
    const pageIds = selectableRows.map((row) => row.id);
    const allChecked =
        pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
    const selectedRows = roster.data.filter((row) => selected.includes(row.id));
    const proxyStudents = selectedRows.filter((row) =>
        proxyType === 'masuk' ? row.canCheckIn : row.canCheckOut,
    );
    const selectedCheckIns = selectedRows.filter(
        (row) => row.canCheckIn,
    ).length;
    const selectedCheckOuts = selectedRows.filter(
        (row) => row.canCheckOut,
    ).length;

    function apply(next: Partial<Filters>) {
        setSelected([]);

        const params = { ...filters, ...next };
        router.get(
            index.url(),
            {
                tanggal: params.tanggal,
                kategori: params.category,
                search: params.search || undefined,
                industri: params.industri || undefined,
            },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

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

    return (
        <section className="max-w-full min-w-0 rounded-3xl bg-surface p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <CalendarDays className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Presensi harian
                        </h2>
                        <p className="text-sm text-muted">{dateLabel}</p>
                    </div>
                </div>

                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    {can.proxyAttendance && (
                        <>
                            <button
                                type="button"
                                onClick={() => setProxyType('masuk')}
                                disabled={selectedCheckIns === 0}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-primary/25 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft disabled:opacity-40 sm:flex-none"
                            >
                                <UserCheck className="size-4" />
                                Masuk
                                {selectedCheckIns > 0
                                    ? ` (${selectedCheckIns})`
                                    : ''}
                            </button>
                            <button
                                type="button"
                                onClick={() => setProxyType('pulang')}
                                disabled={selectedCheckOuts === 0}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-40 sm:flex-none"
                            >
                                <UserCheck className="size-4" />
                                Pulang
                                {selectedCheckOuts > 0
                                    ? ` (${selectedCheckOuts})`
                                    : ''}
                            </button>
                        </>
                    )}
                    <input
                        type="date"
                        aria-label="Tanggal presensi"
                        value={filters.tanggal}
                        onChange={(event) =>
                            apply({ tanggal: event.target.value })
                        }
                        className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none sm:w-auto"
                    />
                </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
                {categories.map((category) => (
                    <button
                        key={category.value}
                        type="button"
                        aria-pressed={filters.category === category.value}
                        onClick={() => apply({ category: category.value })}
                        className={cn(
                            'flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                            filters.category === category.value
                                ? 'border-primary bg-primary-soft text-primary'
                                : 'border-line bg-canvas/50 text-muted hover:border-primary/30 hover:text-ink',
                        )}
                    >
                        <span>{category.label}</span>
                        <span className="tabular-nums">
                            {summary[category.value]}
                        </span>
                    </button>
                ))}
            </div>

            <div className="mt-3 grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_16rem]">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        apply({ search });
                    }}
                    className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2"
                >
                    <div className="relative min-w-0">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama siswa"
                            aria-label="Cari berdasarkan nama siswa"
                            className="w-full min-w-0 rounded-xl border border-line bg-canvas py-2.5 pr-3 pl-9 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        className="rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-primary"
                    >
                        Cari
                    </button>
                </form>

                <select
                    value={filters.industri ?? ''}
                    onChange={(event) =>
                        apply({
                            industri: event.target.value
                                ? Number(event.target.value)
                                : null,
                        })
                    }
                    aria-label="Filter industri"
                    className="w-full min-w-0 rounded-xl border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                >
                    <option value="">Semua industri</option>
                    {industries.map((industry) => (
                        <option key={industry.id} value={industry.id}>
                            {industry.name}
                        </option>
                    ))}
                </select>
            </div>

            {filters.category === 'alpha' && (
                <p className="mt-3 text-xs text-muted">
                    Pada hari berjalan, murid yang belum presensi ditampilkan
                    sebagai Belum lengkap. Status Alpa baru dihitung setelah
                    hari kerja berlalu.
                </p>
            )}

            {roster.data.length === 0 ? (
                <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-12 text-center">
                    <CheckCircle2 className="size-8 text-muted" />
                    <p className="text-sm font-medium text-ink">
                        Tidak ada data yang cocok dengan filter ini
                    </p>
                </div>
            ) : (
                <div className="mt-4 max-w-full overflow-x-auto overscroll-x-contain">
                    <table className="w-full min-w-[58rem] text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                                {can.proxyAttendance && (
                                    <th className="w-10 px-3 py-2.5">
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            onChange={toggleAll}
                                            aria-label="Pilih semua murid yang dapat dipresensikan"
                                            className="size-4 accent-[var(--color-primary)]"
                                        />
                                    </th>
                                )}
                                <th className="px-3 py-2.5">Nama</th>
                                <th className="px-3 py-2.5">Kelas</th>
                                <th className="px-3 py-2.5">Industri</th>
                                <th className="px-3 py-2.5">Status</th>
                                <th className="px-3 py-2.5">Jam Masuk</th>
                                <th className="px-3 py-2.5">Jam Pulang</th>
                                <th className="px-3 py-2.5">Keterlambatan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {roster.data.map((row) => {
                                const selectable =
                                    row.canCheckIn || row.canCheckOut;

                                return (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-canvas/50"
                                    >
                                        {can.proxyAttendance && (
                                            <td className="px-3 py-3">
                                                <input
                                                    type="checkbox"
                                                    disabled={!selectable}
                                                    checked={selected.includes(
                                                        row.id,
                                                    )}
                                                    onChange={() =>
                                                        toggle(row.id)
                                                    }
                                                    aria-label={`Pilih ${row.name}`}
                                                    className="size-4 accent-[var(--color-primary)] disabled:opacity-30"
                                                />
                                            </td>
                                        )}
                                        <td className="px-3 py-3">
                                            <p className="font-semibold text-ink">
                                                {row.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {row.nis}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3 text-muted">
                                            {row.class ?? '-'}
                                        </td>
                                        <td className="px-3 py-3 text-muted">
                                            {row.industry ?? '-'}
                                        </td>
                                        <td className="px-3 py-3">
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
                                        <td className="px-3 py-3 text-muted">
                                            {row.arrivalTime ?? '-'}
                                        </td>
                                        <td className="px-3 py-3 text-muted">
                                            {row.departureTime ?? '-'}
                                        </td>
                                        <td className="px-3 py-3 text-muted">
                                            {row.lateMinutes === null
                                                ? '-'
                                                : `${row.lateMinutes} menit`}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination meta={roster} />

            {can.proxyAttendance && proxyType && (
                <ProxyAttendanceModal
                    open
                    onClose={() => setProxyType(null)}
                    students={proxyStudents}
                    date={filters.tanggal}
                    dateLabel={dateLabel}
                    type={proxyType}
                    onDeselect={toggle}
                    onDone={() => {
                        setProxyType(null);
                        setSelected([]);
                    }}
                />
            )}
        </section>
    );
}
