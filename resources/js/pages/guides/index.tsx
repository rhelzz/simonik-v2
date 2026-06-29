import { router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Download,
    FileText,
    LoaderCircle,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/GuideController';
import { Modal } from '@/components/ui/modal';
import { AppLayout } from '@/layouts/app-layout';

type GuideRow = {
    id: number;
    judul: string;
    deskripsi: string | null;
    dokumen: string | null;
    type: string;
    size: string | null;
    uploadedAt: string | null;
};

type Props = {
    guides: GuideRow[];
    can: { manage: boolean };
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export default function GuidesIndex({ guides, can }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<GuideRow | null>(null);

    const form = useForm<{
        judul: string;
        deskripsi: string;
        dokumen: File | null;
    }>({ judul: '', deskripsi: '', dokumen: null });

    function close() {
        setOpen(false);
        form.reset();
        form.clearErrors();
    }

    function openCreate() {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(guide: GuideRow) {
        form.setData({
            judul: guide.judul,
            deskripsi: guide.deskripsi ?? '',
            dokumen: null,
        });
        form.clearErrors();
        setEditing(guide);
        setOpen(true);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: close,
        };

        if (editing) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(update.url(editing.id), options);
        } else {
            form.transform((data) => data);
            form.post(store.url(), options);
        }
    }

    function remove(guide: GuideRow) {
        if (confirm(`Hapus panduan "${guide.judul}"?`)) {
            router.delete(destroy.url(guide.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Panduan PKL">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Panduan PKL
                        </h2>
                        <p className="text-sm text-muted">
                            {guides.length} dokumen tersedia untuk diunduh
                        </p>
                    </div>
                    {can.manage && (
                        <button
                            type="button"
                            onClick={openCreate}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Plus className="size-4" />
                            Tambah panduan
                        </button>
                    )}
                </div>

                {guides.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <BookOpen className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada panduan
                        </p>
                        {can.manage && (
                            <p className="text-xs text-muted">
                                Unggah dokumen panduan untuk siswa.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        {guides.map((guide) => (
                            <article
                                key={guide.id}
                                className="flex gap-3 rounded-2xl border border-line bg-canvas/30 p-4"
                            >
                                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <FileText className="size-5" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-semibold text-ink">
                                        {guide.judul}
                                    </h3>
                                    {guide.deskripsi && (
                                        <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                                            {guide.deskripsi}
                                        </p>
                                    )}
                                    <p className="mt-1 text-xs text-muted">
                                        {guide.type}
                                        {guide.size ? ` · ${guide.size}` : ''}
                                        {guide.uploadedAt
                                            ? ` · ${guide.uploadedAt}`
                                            : ''}
                                    </p>

                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        {guide.dokumen && (
                                            <a
                                                href={guide.dokumen}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                                            >
                                                <Download className="size-4" />
                                                Buka / Unduh
                                            </a>
                                        )}
                                        {can.manage && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(guide)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${guide.judul}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(guide)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${guide.judul}`}
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {can.manage && (
                <Modal
                    open={open}
                    onClose={close}
                    title={editing ? 'Edit panduan' : 'Tambah panduan'}
                >
                    <form onSubmit={submit} className="space-y-4">
                        <Field
                            label="Judul"
                            htmlFor="judul"
                            error={form.errors.judul}
                        >
                            <input
                                id="judul"
                                value={form.data.judul}
                                onChange={(event) =>
                                    form.setData('judul', event.target.value)
                                }
                                placeholder="mis. Buku Panduan PKL 2026"
                                className={inputClass}
                                autoFocus
                            />
                        </Field>
                        <Field
                            label="Deskripsi (opsional)"
                            htmlFor="deskripsi"
                            error={form.errors.deskripsi}
                        >
                            <textarea
                                id="deskripsi"
                                value={form.data.deskripsi}
                                onChange={(event) =>
                                    form.setData(
                                        'deskripsi',
                                        event.target.value,
                                    )
                                }
                                rows={3}
                                placeholder="Penjelasan singkat isi dokumen…"
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label={
                                editing
                                    ? 'Ganti berkas (opsional)'
                                    : 'Berkas dokumen'
                            }
                            htmlFor="dokumen"
                            error={form.errors.dokumen}
                        >
                            <input
                                id="dokumen"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                onChange={(event) =>
                                    form.setData(
                                        'dokumen',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                            />
                            <p className="text-xs text-muted">
                                PDF, Word, Excel, atau PowerPoint · maks 10 MB
                            </p>
                        </Field>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={close}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                            >
                                {form.processing && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Simpan
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AppLayout>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
}
