import { Link } from '@inertiajs/react';
import { ChevronRight, Fingerprint, Network } from 'lucide-react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { classes } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { DailyRoster } from '@/components/attendance-monitor/daily-roster';
import type {
    RosterRow,
    RosterTab,
} from '@/components/attendance-monitor/daily-roster';
import { ResetAttendanceModal } from '@/components/attendance-monitor/reset-modal';
import type { ResetOption } from '@/components/attendance-monitor/reset-modal';
import { RateCard } from '@/components/dashboard/widgets';
import type { RateByRange } from '@/components/dashboard/widgets';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ScopeNote } from '@/components/ui/scope-note';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type DepartemenCard = {
    id: number;
    name: string;
    students: number;
};

type Props = {
    departemens: DepartemenCard[];
    scopeLabel: string;
    attendanceRate: RateByRange;
    roster: Paginated<RosterRow>;
    summary: { sudah: number; belum: number };
    filters: { tanggal: string; tab: RosterTab };
    dateLabel: string;
    can: { proxyAttendance: boolean; reset: boolean };
    classOptions: ResetOption[];
    industryOptions: ResetOption[];
};

export default function AttendanceMonitorIndex({
    departemens,
    scopeLabel,
    attendanceRate,
    roster,
    summary,
    filters,
    dateLabel,
    can,
    classOptions,
    industryOptions,
}: Props) {
    const [resetOpen, setResetOpen] = useState(false);

    return (
        <AppLayout title="Data Absen">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Breadcrumb items={[{ label: 'Data Absen' }]} />

                {can.reset && (
                    <button
                        type="button"
                        onClick={() => setResetOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                    >
                        <Trash2 className="size-4" />
                        Reset data absen
                    </button>
                )}
            </div>

            <div className="mt-4">
                <RateCard
                    icon={Fingerprint}
                    title="Rate absensi"
                    subtitle={scopeLabel}
                    data={attendanceRate}
                    tint="bg-primary-soft text-primary"
                />
            </div>

            {/* Pertanyaan harian ("siapa yang belum absen?") di atas,
                penelusuran per jurusan di bawah. */}
            <div className="mt-5">
                <DailyRoster
                    roster={roster}
                    summary={summary}
                    filters={filters}
                    dateLabel={dateLabel}
                    can={can}
                />
            </div>

            <section className="mt-5 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Fingerprint className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Monitoring kehadiran
                        </h2>
                        <p className="text-sm text-muted">
                            Pilih jurusan untuk menelusuri kelas, murid, lalu
                            detail absen.
                        </p>
                        <ScopeNote label={scopeLabel} />
                    </div>
                </div>

                {departemens.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Network className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada data dalam cakupan Anda
                        </p>
                    </div>
                ) : (
                    /* Tanpa gap: kartu jurusan dirapatkan agar tidak memakan
                       ruang ke bawah. Garis pemisah datang dari border-t/l
                       wadah + border-r/b tiap kartu, sehingga sambungannya
                       tetap 1px (bukan dobel 2px seperti kalau tiap kartu
                       memakai border penuh sendiri-sendiri). */
                    <div className="mt-5 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border-t border-l border-line sm:grid-cols-2 lg:grid-cols-3">
                        {departemens.map((departemen) => (
                            <Link
                                key={departemen.id}
                                href={classes.url(departemen.id)}
                                prefetch
                                className="group flex items-center justify-between gap-3 border-r border-b border-line bg-canvas/40 p-4 transition-colors hover:bg-canvas"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="grid size-10 place-items-center rounded-xl bg-surface text-primary">
                                        <Network className="size-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-ink">
                                            {departemen.name}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {departemen.students} murid
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="size-5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </Link>
                        ))}
                    </div>
                )}
            </section>

            {can.reset && (
                <ResetAttendanceModal
                    open={resetOpen}
                    onClose={() => setResetOpen(false)}
                    departemens={departemens}
                    classOptions={classOptions}
                    industryOptions={industryOptions}
                />
            )}
        </AppLayout>
    );
}
