import { Award, Fingerprint, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Performance = {
    attendance: {
        hadir: number;
        izin: number;
        sakit: number;
        alpha: number;
        total: number;
    };
    journal: { total: number };
    attendanceRate: number;
    journalRate: number;
    effectiveDays: number;
    avg: number | null;
    grade: string | null;
};

const gradeTint: Record<string, string> = {
    A: 'bg-positive/15 text-positive',
    B: 'bg-primary-soft text-primary',
    C: 'bg-warning/15 text-warning',
    D: 'bg-red-100 text-red-600',
};

/**
 * Kartu rekap performa anak magang berbasis hitungan (menggantikan verifikasi):
 * kehadiran, pengisian jurnal, dan nilai akhir + grade.
 */
export function PerformanceSummary({
    performance,
}: {
    performance: Performance;
}) {
    const { attendance, journal, attendanceRate, journalRate, avg, grade } =
        performance;

    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
            <h3 className="text-base font-bold text-ink">Rekap performa</h3>
            <p className="text-sm text-muted">
                Ringkasan kehadiran, jurnal, dan nilai anak magang.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-line bg-canvas/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary">
                            <Fingerprint className="size-4" />
                        </span>
                        Kehadiran
                    </div>
                    <RateBar value={attendanceRate} tint="bg-primary" />
                    <div className="mt-3 grid grid-cols-4 gap-1 text-center">
                        <Stat label="Hadir" value={attendance.hadir} />
                        <Stat label="Izin" value={attendance.izin} />
                        <Stat label="Sakit" value={attendance.sakit} />
                        <Stat label="Alpha" value={attendance.alpha} />
                    </div>
                </div>

                <div className="rounded-2xl border border-line bg-canvas/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <span className="grid size-8 place-items-center rounded-xl bg-warning/15 text-warning">
                            <NotebookPen className="size-4" />
                        </span>
                        Pengisian jurnal
                    </div>
                    <RateBar value={journalRate} tint="bg-warning" />
                    <div className="mt-3 text-center">
                        <Stat label="Total jurnal" value={journal.total} />
                    </div>
                </div>

                <div className="rounded-2xl border border-line bg-canvas/30 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                        <span className="grid size-8 place-items-center rounded-xl bg-positive/15 text-positive">
                            <Award className="size-4" />
                        </span>
                        Nilai akhir
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        <p className="text-3xl font-bold text-ink">
                            {avg ?? '—'}
                        </p>
                        {grade ? (
                            <span
                                className={cn(
                                    'inline-flex size-9 items-center justify-center rounded-xl text-base font-bold',
                                    gradeTint[grade] ?? 'bg-canvas text-muted',
                                )}
                            >
                                {grade}
                            </span>
                        ) : (
                            <span className="text-xs text-muted">
                                Belum dinilai
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function RateBar({ value, tint }: { value: number; tint: string }) {
    return (
        <div className="mt-3">
            <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-ink">{value}%</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-canvas">
                <div
                    className={cn('h-full rounded-full', tint)}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <p className="text-lg font-bold text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
        </div>
    );
}
