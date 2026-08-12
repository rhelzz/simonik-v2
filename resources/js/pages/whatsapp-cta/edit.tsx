import { useForm } from '@inertiajs/react';
import { AlertCircle, LoaderCircle, MessageCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { update } from '@/actions/App/Http/Controllers/WhatsappCtaSettingController';
import { AppLayout } from '@/layouts/app-layout';

type WhatsappCtaEditProps = {
    whatsapp: { number: string | null; message: string | null };
};

export default function WhatsappCtaEdit({ whatsapp }: WhatsappCtaEditProps) {
    const form = useForm({
        whatsapp_number: whatsapp.number ?? '',
        whatsapp_message: whatsapp.message ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(update.url(), { preserveScroll: true });
    }

    return (
        <AppLayout title="CTA WhatsApp">
            <div className="max-w-xl">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="mb-5 flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                            <MessageCircle className="size-5" />
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-ink">
                                Tombol CTA WhatsApp di landing page
                            </h3>
                            <p className="text-xs text-muted">
                                Nomor tujuan dan pesan yang otomatis terisi saat
                                pengunjung mengklik tombol "Chat via WhatsApp" —
                                supaya kamu langsung tahu pengunjung itu datang
                                dari aplikasi ini.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="whatsapp_number"
                                className="mb-1.5 block text-xs font-semibold text-ink"
                            >
                                Nomor WhatsApp
                            </label>
                            <input
                                id="whatsapp_number"
                                type="text"
                                value={form.data.whatsapp_number}
                                onChange={(event) =>
                                    form.setData(
                                        'whatsapp_number',
                                        event.target.value,
                                    )
                                }
                                placeholder="081234567890"
                                className="w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-muted">
                                Boleh diawali 0 atau 62 — otomatis
                                dinormalisasi.
                            </p>
                            {form.errors.whatsapp_number && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                    <AlertCircle className="size-3.5 shrink-0" />
                                    {form.errors.whatsapp_number}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="whatsapp_message"
                                className="mb-1.5 block text-xs font-semibold text-ink"
                            >
                                Template pesan
                            </label>
                            <textarea
                                id="whatsapp_message"
                                rows={4}
                                value={form.data.whatsapp_message}
                                onChange={(event) =>
                                    form.setData(
                                        'whatsapp_message',
                                        event.target.value,
                                    )
                                }
                                placeholder="Halo, saya membuka aplikasi PKL Murid SMK dan ingin berdiskusi dengan Anda mengenai "
                                className="w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/15 focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-muted">
                                Tips: akhiri dengan "mengenai " (tanpa titik)
                                supaya pengunjung tinggal melanjutkan ketikannya
                                begitu chat terbuka.
                            </p>
                            {form.errors.whatsapp_message && (
                                <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-500">
                                    <AlertCircle className="size-3.5 shrink-0" />
                                    {form.errors.whatsapp_message}
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                            >
                                {form.processing && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Simpan CTA WhatsApp
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
