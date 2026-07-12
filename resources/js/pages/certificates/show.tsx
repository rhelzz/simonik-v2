import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Award, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    index,
    print,
    store,
} from '@/actions/App/Http/Controllers/CertificateController';
import { Select } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedData } from '@/types';

type CertificateRow = {
    id: number;
    title: string;
    templateName: string | null;
    createdAt: string | null;
};

type Props = {
    student: {
        id: number;
        name: string;
        nis: string;
        class: string | null;
        industry: string | null;
        eligible: boolean;
    };
    certificates: CertificateRow[];
    templates: { id: number; name: string }[];
    canManage: boolean;
};

export default function CertificateShow({
    student,
    certificates,
    templates,
    canManage,
}: Props) {
    const { auth } = usePage<SharedData>().props;
    const isStudent = auth.roles?.includes('siswa');
    const [templateId, setTemplateId] = useState('');
    const [title, setTitle] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function assign(event: React.FormEvent) {
        event.preventDefault();

        if (!templateId) {
            return;
        }

        setSubmitting(true);
        router.post(
            store.url(student.id),
            { certificate_template_id: templateId, title: title || null },
            {
                preserveScroll: true,
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    setTemplateId('');
                    setTitle('');
                },
            },
        );
    }

    function revoke(certificate: CertificateRow) {
        if (!confirm(`Hapus "${certificate.title}"?`)) {
            return;
        }

        router.delete(
            destroy.url({ student: student.id, certificate: certificate.id }),
            {
                preserveScroll: true,
            },
        );
    }

    return (
        <AppLayout title="Sertifikat">
            <div className="space-y-4">
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

                {!student.eligible && (
                    <div className="flex items-center gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                        <TriangleAlert className="size-4 shrink-0" />
                        Status PKL siswa belum “selesai”. Sertifikat dapat
                        dipratinjau, tapi belum dapat dicetak.
                    </div>
                )}

                {canManage && (
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <h3 className="text-sm font-bold text-ink">
                            Tambah sertifikat
                        </h3>
                        <form
                            onSubmit={assign}
                            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <div className="flex-1">
                                <label className="mb-1.5 block text-xs font-semibold text-muted">
                                    Template
                                </label>
                                <Select
                                    value={templateId}
                                    onChange={setTemplateId}
                                    placeholder="Pilih template…"
                                    options={templates.map((template) => ({
                                        value: String(template.id),
                                        label: template.name,
                                    }))}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="mb-1.5 block text-xs font-semibold text-muted">
                                    Label (opsional)
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                    placeholder="mis. Sertifikat Industri XYZ"
                                    className="w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!templateId || submitting}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Plus className="size-4" />
                                Tambah
                            </button>
                        </form>
                        {templates.length === 0 && (
                            <p className="mt-3 text-xs text-muted">
                                Belum ada template. Buat dulu di menu Template
                                Sertifikat.
                            </p>
                        )}
                    </section>
                )}

                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-ink">
                        Daftar sertifikat ({certificates.length})
                    </h3>

                    {certificates.length === 0 ? (
                        <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                            <Award className="size-8 text-muted" />
                            <p className="text-sm font-medium text-ink">
                                Belum ada sertifikat
                            </p>
                        </div>
                    ) : (
                        <ul className="mt-4 divide-y divide-line">
                            {certificates.map((certificate) => (
                                <li
                                    key={certificate.id}
                                    className="flex items-center justify-between gap-3 py-3"
                                >
                                    <div>
                                        <p className="font-semibold text-ink">
                                            {certificate.title}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {certificate.templateName ??
                                                'Template dihapus'}
                                            {certificate.createdAt
                                                ? ` · ${certificate.createdAt}`
                                                : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={print.url({
                                                student: student.id,
                                                certificate: certificate.id,
                                            })}
                                            className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-canvas"
                                        >
                                            Pratinjau
                                        </Link>
                                        {canManage && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    revoke(certificate)
                                                }
                                                className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-warning"
                                                aria-label="Hapus sertifikat"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
