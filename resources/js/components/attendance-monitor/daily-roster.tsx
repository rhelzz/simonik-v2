import { router } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, UserCheck, UserX } from 'lucide-react';
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
    /** Status efektif: 'hadir'|'sakit'|'izin'|'libur'|'alpha'|'belum'|'tidak-dihitung'. */
    status: string;
    statusLabel: string;
    arrivalTime: string | null;
    departureTime: string | null;
    lateMinutes: number | null;
};

/**
 * Warna lencana status. 'alpha' merah karena ia menandai ketidakhadiran tanpa
 * keterangan — satu-satunya status yang lahir dari ketiadaan data, dan
 * satu-satunya yang perlu ditindaklanjuti.
 */
const statusStyles: Record<string, string> = {
    hadir: 'bg-positive/15 text-positive',
    masuk: 'bg-positive/15 text-positive',
    sakit: 'bg-warning/15 text-warning',
    izin: 'bg-warning/15 text-warning',
    libur: 'bg-canvas text-muted',
    alpha: 'bg-red-500/15 text-red-500',
    belum: 'bg-canvas text-muted',
    'belum-lengkap': 'bg-warning/15 text-warning',
    'tidak-dihitung': 'bg-canvas text-muted',
};

export type RosterTab = 'belum' | 'sudah';

type Props = {
    roster: Paginated<RosterRow>;
    summary: { sudah: number; belum: number };
    filters: { tanggal: string; tab: RosterTab };
    dateLabel: string;
    can: { proxyAttendance: boolean };
};

/**
 * Panel "Presensi hari ini" — siapa yang sudah dan belum presensi pada satu
 * tanggal, dalam cakupan role pemanggil.
 *
 * Satu tabel dengan dua tab, bukan dua tabel bersanding: dua paginasi
 * independen di satu layar membingungkan, dan di HP keduanya menumpuk jadi
 * layar yang sangat panjang. Jumlah kedua kelompok tetap terlihat sekaligus
 * karena ditulis di label tabnya.
 */
export function DailyRoster({
    roster,
    summary,
    filters,
    dateLabel,
    can,
}: Props) {
    const [selected, setSelected] = useState<number[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    // Presensi diwakilkan hanya masuk akal untuk murid yang BELUM presensi.
    const canPick = can.proxyAttendance && filters.tab === 'belum';
    const showsAlpha = roster.data.some((row) => row.status === 'alpha');
    const pageIds = roster.data.map((row) => row.id);
    const allChecked =
        pageIds.length > 0 && pageIds.every((id) => selected.includes(id));

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

    /**
     * preserveScroll: mengganti tab tidak boleh melempar operator ke atas
     * halaman. preserveState: menjaga posisi & state komponen lain.
     */
    function apply(next: Partial<{ tanggal: string; tab: RosterTab }>) {
        // Pilihan murid tidak boleh terbawa saat tanggal/tab berganti — daftar
        // yang tampil berubah, jadi ID yang tersimpan tidak lagi bermakna.
        setSelected([]);

        router.get(
            index.url(),
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
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

                <div className="flex items-center gap-2">
                    {canPick && (
                        <button
                            type="button"
                            onClick={() => setModalOpen(true)}
                            disabled={selected.length === 0}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                        >
                            <UserCheck className="size-4" />
                            Presensikan
                            {selected.length > 0 ? ` (${selected.length})` : ''}
                        </button>
                    )}

                    <label className="text-xs font-semibold text-muted">
                        <span className="sr-only">Tanggal</span>
                        <input
                            type="date"
                            value={filters.tanggal}
                            onChange={(event) =>
                                apply({ tanggal: event.target.value })
                            }
                            className="block rounded-xl border border-line bg-canvas px-3 py-2 text-sm font-normal text-ink focus:border-primary focus:outline-none"
                        />
                    </label>
                </div>
            </div>

            <div className="mt-4 flex gap-1 rounded-xl bg-canvas p-1">
                <TabButton
                    active={filters.tab === 'belum'}
                    onClick={() => apply({ tab: 'belum' })}
                >
                    Belum ({summary.belum})
                </TabButton>
                <TabButton
                    active={filters.tab === 'sudah'}
                    onClick={() => apply({ tab: 'sudah' })}
                >
                    Sudah ({summary.sudah})
                </TabButton>
            </div>

            {/* Alpha adalah kesimpulan yang ditarik sistem, bukan sanksi yang
                diketik seseorang — dinyatakan agar tidak jadi sengketa dengan
                siswa/orang tua. */}
            {showsAlpha && (
                <p className="mt-3 text-xs text-muted">
                    Alpha dihitung otomatis dari ketiadaan data presensi pada
                    hari kerja. Akhir pekan dan tanggal di luar periode PKL
                    tidak dihitung.
                </p>
            )}

            {roster.data.length === 0 ? (
                <EmptyState tab={filters.tab} />
            ) : (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[34rem] text-sm">
                        <thead>
                            <tr className="border-b border-line text-left text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                                {canPick && (
                                    <th className="w-10 px-3 py-2.5">
                                        <input
                                            type="checkbox"
                                            checked={allChecked}
                                            onChange={toggleAll}
                                            aria-label="Pilih semua murid di halaman ini"
                                            className="size-4 accent-[var(--color-primary)]"
                                        />
                                    </th>
                                )}
                                <th className="px-3 py-2.5">Nama</th>
                                <th className="px-3 py-2.5">Kelas</th>
                                <th className="px-3 py-2.5">Industri</th>
                                <th className="px-3 py-2.5">Status</th>
                                {filters.tab === 'sudah' && (
                                    <>
                                        <th className="px-3 py-2.5">
                                            Jam Masuk
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Jam Pulang
                                        </th>
                                        <th className="px-3 py-2.5">
                                            Keterlambatan
                                        </th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {roster.data.map((row) => (
                                <tr key={row.id}>
                                    {canPick && (
                                        <td className="px-3 py-2.5">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(
                                                    row.id,
                                                )}
                                                onChange={() => toggle(row.id)}
                                                aria-label={`Pilih ${row.name}`}
                                                className="size-4 accent-[var(--color-primary)]"
                                            />
                                        </td>
                                    )}
                                    <td className="px-3 py-2.5">
                                        <p className="font-semibold text-ink">
                                            {row.name}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {row.nis}
                                        </p>
                                    </td>
                                    <td className="px-3 py-2.5 text-muted">
                                        {row.class ?? '—'}
                                    </td>
                                    <td className="px-3 py-2.5 text-muted">
                                        {row.industry ?? '—'}
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
                                    {filters.tab === 'sudah' && (
                                        <>
                                            <td className="px-3 py-2.5 text-muted">
                                                {row.arrivalTime ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted">
                                                {row.departureTime ?? '—'}
                                            </td>
                                            <td className="px-3 py-2.5 text-muted">
                                                {row.lateMinutes === null
                                                    ? '—'
                                                    : row.lateMinutes > 0
                                                      ? `${row.lateMinutes} menit`
                                                      : 'Tepat waktu'}
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Pagination meta={roster} />

            {canPick && (
                <ProxyAttendanceModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    students={roster.data.filter((row) =>
                        selected.includes(row.id),
                    )}
                    date={filters.tanggal}
                    dateLabel={dateLabel}
                    onDeselect={toggle}
                    onDone={() => {
                        setModalOpen(false);
                        setSelected([]);
                    }}
                />
            )}
        </section>
    );
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors',
                active
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-muted hover:text-ink',
            )}
        >
            {children}
        </button>
    );
}

/**
 * Tab "belum" yang kosong adalah keadaan SUKSES, bukan "tidak ada data" —
 * dibedakan supaya operator tidak mengira fiturnya rusak.
 */
function EmptyState({ tab }: { tab: RosterTab }) {
    const Icon = tab === 'belum' ? CheckCircle2 : UserX;

    return (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-12 text-center">
            <Icon
                className={cn(
                    'size-8',
                    tab === 'belum' ? 'text-positive' : 'text-muted',
                )}
            />
            <p className="text-sm font-medium text-ink">
                {tab === 'belum'
                    ? 'Semua murid sudah presensi pada tanggal ini'
                    : 'Belum ada murid yang presensi pada tanggal ini'}
            </p>
        </div>
    );
}
