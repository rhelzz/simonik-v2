import { Link } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { ArrowLeft, Printer, TriangleAlert } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/CertificateController';
import { CertificatePreview } from '@/components/certificates/certificate-preview';
import type { PreviewAnchor } from '@/components/certificates/certificate-preview';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedData } from '@/types';

type Props = {
    student: {
        id: number;
        name: string;
        nis: string;
        class: string | null;
        industry: string | null;
        eligible: boolean;
    };
    template: { background: string | null; anchors: PreviewAnchor[] } | null;
};

const printCss = `@media print {
    @page { size: landscape; margin: 0; }
    body * { visibility: hidden; }
    #cert-print, #cert-print * { visibility: visible; }
    #cert-print { position: absolute; inset: 0; width: 100%; }
}`;

export default function CertificateShow({ student, template }: Props) {
    const { auth } = usePage<SharedData>().props;
    const isStudent = auth.roles?.includes('siswa');

    return (
        <AppLayout title="Sertifikat">
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
                    {template && (
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Printer className="size-4" />
                            Cetak / Unduh PDF
                        </button>
                    )}
                </div>

                {!student.eligible && (
                    <div className="flex items-center gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium text-warning print:hidden">
                        <TriangleAlert className="size-4 shrink-0" />
                        Status PKL siswa belum “selesai”. Sertifikat tetap dapat
                        dipratinjau.
                    </div>
                )}

                {template === null ? (
                    <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface py-16 text-center print:hidden">
                        <TriangleAlert className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada template sertifikat aktif
                        </p>
                        <p className="text-xs text-muted">
                            {isStudent
                                ? 'Sertifikat belum tersedia. Hubungi admin.'
                                : 'Aktifkan salah satu template terlebih dahulu.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-3xl bg-surface p-3 sm:p-5">
                        <div id="cert-print">
                            <CertificatePreview
                                background={template.background}
                                items={template.anchors}
                            />
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
