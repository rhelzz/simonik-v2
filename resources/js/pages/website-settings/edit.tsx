import { useForm } from '@inertiajs/react';
import { AlertCircle, Globe, LoaderCircle, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { update } from '@/actions/App/Http/Controllers/WebsiteSettingController';
import { AppLayout } from '@/layouts/app-layout';

type WebsiteSettingsProps = {
    favicon: { url: string; updatedAt: string | null };
};

export default function WebsiteSettingsEdit({ favicon }: WebsiteSettingsProps) {
    const [preview, setPreview] = useState<string | null>(null);
    const form = useForm<{ favicon: File | null }>({ favicon: null });

    function onFile(file: File | null) {
        form.setData('favicon', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        form.transform((data) => ({ ...data, _method: 'put' }));
        form.post(update.url(), { forceFormData: true, preserveScroll: true });
    }

    return (
        <AppLayout title="Website Settings">
            <div className="max-w-xl">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="mb-5 flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                            <Globe className="size-5" />
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-ink">
                                Favicon situs
                            </h3>
                            <p className="text-xs text-muted">
                                Ikon yang tampil di tab browser. Berkas .ico,
                                maksimal 512 KB.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={preview ?? favicon.url}
                                alt="Favicon saat ini"
                                className="size-12 rounded-lg border border-line bg-canvas/40 object-contain p-1.5"
                            />
                            <label
                                htmlFor="favicon"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary"
                            >
                                <UploadCloud className="size-4" />
                                Pilih berkas .ico
                            </label>
                            <input
                                id="favicon"
                                type="file"
                                accept=".ico,image/x-icon,image/vnd.microsoft.icon"
                                className="hidden"
                                onChange={(event) =>
                                    onFile(event.target.files?.[0] ?? null)
                                }
                            />
                        </div>
                        {form.errors.favicon && (
                            <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                                <AlertCircle className="size-3.5 shrink-0" />
                                {form.errors.favicon}
                            </p>
                        )}
                        {favicon.updatedAt && (
                            <p className="text-xs text-muted">
                                Terakhir diperbarui{' '}
                                {new Date(favicon.updatedAt).toLocaleString(
                                    'id-ID',
                                )}
                            </p>
                        )}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={form.processing || !form.data.favicon}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                            >
                                {form.processing && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Simpan favicon
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
