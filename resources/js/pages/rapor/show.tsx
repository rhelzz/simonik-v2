import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, TriangleAlert } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/RaporController';
import { AppLayout } from '@/layouts/app-layout';
import type { Grade } from '@/lib/grade';
import type { SharedData } from '@/types';

type AspectRow = {
    id: number;
    no: number;
    kemampuan: string;
    score: number | null;
    grade: Grade | null;
    qualification: string | null;
};

type SidangRow = { aspek: string; nilai: number; grade: Grade | null };

type Props = {
    student: {
        id: number;
        name: string;
        nis: string;
        class: string | null;
        department: string | null;
        industry: string | null;
        period: string | null;
        startLabel: string | null;
        endLabel: string | null;
        eligible: boolean;
    };
    teknis: AspectRow[];
    nonTeknis: AspectRow[];
    sidang: {
        scores: SidangRow[];
        penguji1: string | null;
        penguji2: string | null;
        deskripsi: string | null;
        status: string | null;
        average: number | null;
    };
    attendance: {
        hadir: number;
        izin: number;
        sakit: number;
        alpha: number;
        libur: number;
        total: number;
    };
    journalTotal: number;
    summary: {
        teknis: number | null;
        nonTeknis: number | null;
        sidang: number | null;
        final: number | null;
        grade: Grade | null;
        qualification: string | null;
    };
    qr: string;
    printedAt: string;
};

const printCss = `@media print {
    @page { size: A4 portrait; margin: 14mm; }
    body * { visibility: hidden; }
    #rapor-print, #rapor-print * { visibility: visible; }
    #rapor-print { position: absolute; left: 0; top: 0; width: 100%; }
}`;

export default function RaporShow({
    student,
    teknis,
    nonTeknis,
    sidang,
    attendance,
    journalTotal,
    summary,
    qr,
    printedAt,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const isStudent = auth.roles?.includes('siswa');

    return (
        <AppLayout title="Rapor Digital">
            <style>{printCss}</style>

            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                    <div className="flex items-center gap-3">
                        {!isStudent && (
                            <Link
                                href={index.url()}
                                className="grid size-9 place-items-center rounded-xl border border-line text-muted transition-colors hover:bg-surface"
                                aria-label="Kembali"
                            >
                                <ArrowLeft className="size-4" />
                            </Link>
                        )}
                        <div>
                            <h2 className="text-base font-bold text-ink">
                                {student.name}
                            </h2>
                            <p className="text-sm text-muted">
                                NIS {student.nis}
                                {student.class ? ` · ${student.class}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Printer className="size-4" />
                        Cetak / Unduh PDF
                    </button>
                </div>

                {!student.eligible && (
                    <div className="flex items-center gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium text-warning print:hidden">
                        <TriangleAlert className="size-4 shrink-0" />
                        Status PKL siswa belum “selesai”. Rapor tetap dapat
                        dipratinjau, namun sebaiknya dicetak setelah nilai
                        dikunci.
                    </div>
                )}

                <div className="overflow-hidden rounded-3xl bg-surface p-5 sm:p-8">
                    <article
                        id="rapor-print"
                        className="mx-auto max-w-3xl text-[13px] leading-relaxed text-black"
                    >
                        {/* Kop */}
                        <header className="border-b-2 border-black pb-4 text-center">
                            <h1 className="text-lg font-extrabold tracking-wide uppercase">
                                Rapor Praktik Kerja Lapangan
                            </h1>
                            <p className="mt-0.5 text-xs text-black/70">
                                Sistem Monitoring PKL — SIMONIK
                            </p>
                        </header>

                        {/* Identitas */}
                        <section className="mt-4 grid grid-cols-2 gap-x-8 gap-y-1.5">
                            <Identity label="Nama" value={student.name} />
                            <Identity label="NIS" value={student.nis} />
                            <Identity
                                label="Kelas"
                                value={student.class ?? '—'}
                            />
                            <Identity
                                label="Jurusan"
                                value={student.department ?? '—'}
                            />
                            <Identity
                                label="Tempat PKL"
                                value={student.industry ?? '—'}
                            />
                            <Identity
                                label="Periode"
                                value={student.period ?? '—'}
                            />
                            <Identity
                                label="Mulai PKL"
                                value={student.startLabel ?? '—'}
                            />
                            <Identity
                                label="Selesai PKL"
                                value={student.endLabel ?? '—'}
                            />
                        </section>

                        {/* Nilai teknis */}
                        <ScoreTable
                            title="A. Aspek Teknis / Kompetensi Kejuruan"
                            rows={teknis}
                        />

                        {/* Nilai non-teknis */}
                        <ScoreTable
                            title="B. Aspek Non-Teknis / Sikap Kerja"
                            rows={nonTeknis}
                        />

                        {/* Sidang */}
                        <section className="mt-5 break-inside-avoid">
                            <h3 className="text-sm font-bold">
                                C. Nilai Sidang / Uji Kompetensi
                            </h3>
                            {sidang.scores.length === 0 ? (
                                <p className="mt-1 text-xs text-black/60">
                                    Belum ada nilai sidang.
                                </p>
                            ) : (
                                <table className="mt-2 w-full border-collapse">
                                    <thead>
                                        <tr className="bg-black/5 text-left text-xs">
                                            <th className="border border-black/20 px-2 py-1.5">
                                                Aspek
                                            </th>
                                            <th className="w-20 border border-black/20 px-2 py-1.5 text-center">
                                                Nilai
                                            </th>
                                            <th className="w-16 border border-black/20 px-2 py-1.5 text-center">
                                                Grade
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sidang.scores.map((row, i) => (
                                            <tr key={i}>
                                                <td className="border border-black/20 px-2 py-1.5">
                                                    {row.aspek}
                                                </td>
                                                <td className="border border-black/20 px-2 py-1.5 text-center font-semibold">
                                                    {row.nilai}
                                                </td>
                                                <td className="border border-black/20 px-2 py-1.5 text-center">
                                                    {row.grade ?? '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {(sidang.penguji1 || sidang.penguji2) && (
                                <p className="mt-1.5 text-xs text-black/70">
                                    Penguji:{' '}
                                    {[sidang.penguji1, sidang.penguji2]
                                        .filter(Boolean)
                                        .join(' & ')}
                                </p>
                            )}
                            {sidang.deskripsi && (
                                <p className="mt-1 text-xs text-black/70">
                                    Catatan: {sidang.deskripsi}
                                </p>
                            )}
                        </section>

                        {/* Rekap kehadiran & jurnal */}
                        <section className="mt-5 break-inside-avoid">
                            <h3 className="text-sm font-bold">
                                D. Rekap Kehadiran & Jurnal
                            </h3>
                            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                                <Recap label="Hadir" value={attendance.hadir} />
                                <Recap label="Izin" value={attendance.izin} />
                                <Recap label="Sakit" value={attendance.sakit} />
                                <Recap label="Alpha" value={attendance.alpha} />
                                <Recap label="Libur" value={attendance.libur} />
                                <Recap label="Jurnal" value={journalTotal} />
                            </div>
                        </section>

                        {/* Ringkasan nilai akhir */}
                        <section className="mt-5 break-inside-avoid rounded-lg border border-black/20 p-3">
                            <div className="grid grid-cols-2 gap-x-8 gap-y-1 sm:grid-cols-4">
                                <Summary
                                    label="Rata-rata teknis"
                                    value={summary.teknis}
                                />
                                <Summary
                                    label="Rata-rata non-teknis"
                                    value={summary.nonTeknis}
                                />
                                <Summary
                                    label="Rata-rata sidang"
                                    value={summary.sidang}
                                />
                                <div>
                                    <p className="text-[11px] text-black/60">
                                        Nilai akhir
                                    </p>
                                    <p className="text-lg font-extrabold">
                                        {summary.final ?? '—'}
                                        {summary.grade
                                            ? ` (${summary.grade})`
                                            : ''}
                                    </p>
                                    {summary.qualification && (
                                        <p className="text-[11px] text-black/60">
                                            {summary.qualification}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* QR keaslian + tanda tangan */}
                        <footer className="mt-6 flex break-inside-avoid items-end justify-between">
                            <div className="flex items-center gap-3">
                                <img
                                    src={qr}
                                    alt="QR verifikasi keaslian"
                                    className="size-24 rounded bg-white"
                                />
                                <div className="max-w-[9rem] text-[11px] text-black/60">
                                    Pindai QR untuk memverifikasi keaslian rapor
                                    ini secara daring.
                                </div>
                            </div>
                            <div className="text-center text-xs">
                                <p>Dicetak pada {printedAt}</p>
                                <div className="mt-12 border-t border-black/40 pt-1">
                                    Pembina PKL
                                </div>
                            </div>
                        </footer>
                    </article>
                </div>
            </div>
        </AppLayout>
    );
}

function Identity({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-2">
            <span className="w-28 shrink-0 text-black/60">{label}</span>
            <span className="font-semibold">: {value}</span>
        </div>
    );
}

function ScoreTable({ title, rows }: { title: string; rows: AspectRow[] }) {
    return (
        <section className="mt-5 break-inside-avoid">
            <h3 className="text-sm font-bold">{title}</h3>
            {rows.length === 0 ? (
                <p className="mt-1 text-xs text-black/60">
                    Belum ada aspek penilaian.
                </p>
            ) : (
                <table className="mt-2 w-full border-collapse">
                    <thead>
                        <tr className="bg-black/5 text-left text-xs">
                            <th className="w-8 border border-black/20 px-2 py-1.5 text-center">
                                No
                            </th>
                            <th className="border border-black/20 px-2 py-1.5">
                                Kemampuan / Kompetensi
                            </th>
                            <th className="w-16 border border-black/20 px-2 py-1.5 text-center">
                                Nilai
                            </th>
                            <th className="w-14 border border-black/20 px-2 py-1.5 text-center">
                                Grade
                            </th>
                            <th className="w-24 border border-black/20 px-2 py-1.5">
                                Keterangan
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td className="border border-black/20 px-2 py-1.5 text-center">
                                    {row.no}
                                </td>
                                <td className="border border-black/20 px-2 py-1.5">
                                    {row.kemampuan}
                                </td>
                                <td className="border border-black/20 px-2 py-1.5 text-center font-semibold">
                                    {row.score ?? '—'}
                                </td>
                                <td className="border border-black/20 px-2 py-1.5 text-center">
                                    {row.grade ?? '—'}
                                </td>
                                <td className="border border-black/20 px-2 py-1.5 text-xs">
                                    {row.qualification ?? '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

function Recap({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded border border-black/15 px-2 py-1.5 text-center">
            <p className="text-lg font-extrabold">{value}</p>
            <p className="text-[11px] text-black/60">{label}</p>
        </div>
    );
}

function Summary({ label, value }: { label: string; value: number | null }) {
    return (
        <div>
            <p className="text-[11px] text-black/60">{label}</p>
            <p className="text-base font-bold">{value ?? '—'}</p>
        </div>
    );
}
