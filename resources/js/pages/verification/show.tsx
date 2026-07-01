import { Head } from '@inertiajs/react';
import {
    BadgeCheck,
    GraduationCap,
    ShieldAlert,
    ShieldCheck,
} from 'lucide-react';

type VerificationRecord = {
    name: string;
    nis: string;
    class: string | null;
    industry: string | null;
    period: string | null;
    nomor: string;
    statusPkl: string | null;
    completed: boolean;
    endLabel: string | null;
    avg: number | null;
    grade: string | null;
};

type Props = {
    valid: boolean;
    record: VerificationRecord | null;
};

const statusLabels: Record<string, string> = {
    proses: 'Sedang berlangsung',
    selesai: 'Selesai',
    belum: 'Belum mulai',
};

export default function VerificationShow({ valid, record }: Props) {
    return (
        <>
            <Head title="Verifikasi Keaslian PKL" />

            <div className="min-h-screen bg-canvas text-ink">
                <header className="mx-auto flex max-w-2xl items-center gap-3 px-6 py-6">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
                        <GraduationCap className="size-5" />
                    </span>
                    <span className="leading-tight">
                        <span className="block text-lg font-extrabold tracking-tight">
                            SIMONIK
                        </span>
                        <span className="block text-xs font-medium text-muted">
                            Verifikasi Keaslian Dokumen PKL
                        </span>
                    </span>
                </header>

                <main className="mx-auto max-w-2xl px-6 pb-16">
                    {valid && record ? (
                        <div className="overflow-hidden rounded-3xl bg-surface shadow-xl shadow-primary/5">
                            <div className="flex items-center gap-3 bg-positive/10 px-6 py-5">
                                <span className="grid size-11 place-items-center rounded-full bg-positive/15 text-positive">
                                    <ShieldCheck className="size-6" />
                                </span>
                                <div>
                                    <p className="text-base font-bold text-positive">
                                        Dokumen Terverifikasi
                                    </p>
                                    <p className="text-xs text-muted">
                                        Data ini tercatat resmi di sistem
                                        SIMONIK.
                                    </p>
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h1 className="text-xl font-extrabold tracking-tight text-ink">
                                            {record.name}
                                        </h1>
                                        <p className="mt-0.5 text-sm text-muted">
                                            NIS {record.nis}
                                            {record.class
                                                ? ` · ${record.class}`
                                                : ''}
                                        </p>
                                    </div>
                                    {record.completed && (
                                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-positive/10 px-3 py-1 text-xs font-semibold text-positive">
                                            <BadgeCheck className="size-3.5" />
                                            Lulus PKL
                                        </span>
                                    )}
                                </div>

                                <dl className="mt-6 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                                    <Field
                                        label="Nomor dokumen"
                                        value={record.nomor}
                                    />
                                    <Field
                                        label="Status PKL"
                                        value={
                                            record.statusPkl
                                                ? (statusLabels[
                                                      record.statusPkl
                                                  ] ?? record.statusPkl)
                                                : '—'
                                        }
                                    />
                                    <Field
                                        label="Tempat PKL"
                                        value={record.industry ?? '—'}
                                    />
                                    <Field
                                        label="Periode"
                                        value={record.period ?? '—'}
                                    />
                                    <Field
                                        label="Tanggal selesai"
                                        value={record.endLabel ?? '—'}
                                    />
                                    <Field
                                        label="Nilai akhir"
                                        value={
                                            record.avg !== null
                                                ? `${record.avg}${record.grade ? ` (${record.grade})` : ''}`
                                                : 'Belum dinilai'
                                        }
                                    />
                                </dl>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-3xl bg-surface shadow-xl shadow-black/5">
                            <div className="flex items-center gap-3 bg-warning/10 px-6 py-5">
                                <span className="grid size-11 place-items-center rounded-full bg-warning/15 text-warning">
                                    <ShieldAlert className="size-6" />
                                </span>
                                <div>
                                    <p className="text-base font-bold text-warning">
                                        Tidak Dapat Diverifikasi
                                    </p>
                                    <p className="text-xs text-muted">
                                        Tautan tidak valid atau telah diubah.
                                    </p>
                                </div>
                            </div>
                            <div className="px-6 py-6 text-sm leading-relaxed text-muted">
                                Pastikan Anda memindai QR code langsung dari
                                dokumen sertifikat atau rapor resmi. Bila
                                masalah berlanjut, hubungi pihak sekolah untuk
                                konfirmasi keaslian dokumen.
                            </div>
                        </div>
                    )}

                    <p className="mt-6 text-center text-xs text-muted">
                        © {new Date().getFullYear()} SIMONIK · Sistem Monitoring
                        PKL
                    </p>
                </main>
            </div>
        </>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-0.5 font-semibold text-ink">{value}</dd>
        </div>
    );
}
