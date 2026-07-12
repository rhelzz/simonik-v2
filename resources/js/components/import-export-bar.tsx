import { useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet, LoaderCircle, Upload } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '@/components/ui/modal';

/**
 * Baris tombol Ekspor + Impor untuk halaman master data. Impor membuka modal
 * berisi tautan unduh template contoh dan input berkas. Hasil impor tampil
 * sebagai banner flash global (ditambah/dilewati/gagal).
 */
export function ImportExportBar({
    exportUrl,
    templateUrl,
    importUrl,
    entityLabel,
}: {
    exportUrl: string;
    templateUrl: string;
    importUrl: string;
    entityLabel: string;
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<{ file: File | null }>({ file: null });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(importUrl, {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        });
    }

    const errors = Object.values(form.errors);

    return (
        <>
            <a
                href={exportUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
            >
                <Download className="size-4" />
                Ekspor
            </a>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
            >
                <Upload className="size-4" />
                Impor
            </button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title={`Impor ${entityLabel}`}
            >
                <form onSubmit={submit} className="space-y-4">
                    <p className="text-sm text-muted">
                        Unggah berkas Excel sesuai template. Data yang sudah ada
                        akan dilewati otomatis.
                    </p>

                    <a
                        href={templateUrl}
                        className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-3 transition-colors hover:border-primary/40"
                    >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-positive/15 text-positive">
                            <FileSpreadsheet className="size-5" />
                        </span>
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink">
                                Unduh template contoh
                            </span>
                            <span className="block text-xs text-muted">
                                Berisi petunjuk pengisian & contoh data.
                            </span>
                        </span>
                        <Download className="ml-auto size-4 shrink-0 text-muted" />
                    </a>

                    <div className="space-y-1.5">
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas">
                            <Upload className="size-4 text-muted" />
                            {form.data.file
                                ? form.data.file.name
                                : 'Pilih berkas .xlsx / .csv'}
                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(event) =>
                                    form.setData(
                                        'file',
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="hidden"
                            />
                        </label>
                        {errors.length > 0 && (
                            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl bg-red-50 p-3">
                                {errors.map((message, i) => (
                                    <p
                                        key={i}
                                        className="text-xs font-medium text-red-600"
                                    >
                                        {message}
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing || !form.data.file}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            {form.processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Impor sekarang
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}
