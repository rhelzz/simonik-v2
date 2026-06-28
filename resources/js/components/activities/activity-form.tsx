import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/ActivityController';
import { RichTextEditor } from '@/components/ui/rich-text-editor';

export type ActivityDefaults = {
    judul?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    description?: string;
    tools?: string;
    image?: string | null;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function Field({
    label,
    htmlFor,
    error,
    children,
    full,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
    full?: boolean;
}) {
    return (
        <div className={full ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
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

export function ActivityForm({
    submitUrl,
    method,
    activity,
    submitLabel,
}: {
    submitUrl: string;
    method: 'post' | 'put';
    activity?: ActivityDefaults;
    submitLabel: string;
}) {
    const form = useForm<{
        judul: string;
        date: string;
        start_time: string;
        end_time: string;
        description: string;
        tools: string;
        image: File | null;
    }>({
        judul: activity?.judul ?? '',
        date: activity?.date ?? '',
        start_time: activity?.start_time ?? '',
        end_time: activity?.end_time ?? '',
        description: activity?.description ?? '',
        tools: activity?.tools ?? '',
        image: null,
    });

    function submit(event: FormEvent) {
        event.preventDefault();

        if (method === 'put') {
            // File upload + PUT needs multipart, so spoof the method over POST.
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(submitUrl, { forceFormData: true });
        } else {
            form.transform((data) => data);
            form.post(submitUrl, { forceFormData: true });
        }
    }

    return (
        <form onSubmit={submit} className="space-y-8">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                        label="Judul kegiatan"
                        htmlFor="judul"
                        error={form.errors.judul}
                        full
                    >
                        <input
                            id="judul"
                            value={form.data.judul}
                            onChange={(event) =>
                                form.setData('judul', event.target.value)
                            }
                            className={inputClass}
                            required
                        />
                    </Field>
                    <Field
                        label="Tanggal"
                        htmlFor="date"
                        error={form.errors.date}
                    >
                        <input
                            id="date"
                            type="date"
                            value={form.data.date}
                            onChange={(event) =>
                                form.setData('date', event.target.value)
                            }
                            className={inputClass}
                            required
                        />
                    </Field>
                    <Field
                        label="Alat / tools"
                        htmlFor="tools"
                        error={form.errors.tools}
                    >
                        <input
                            id="tools"
                            value={form.data.tools}
                            onChange={(event) =>
                                form.setData('tools', event.target.value)
                            }
                            placeholder="mis. Laptop, VS Code"
                            className={inputClass}
                            required
                        />
                    </Field>
                    <Field
                        label="Jam mulai"
                        htmlFor="start_time"
                        error={form.errors.start_time}
                    >
                        <input
                            id="start_time"
                            type="time"
                            value={form.data.start_time}
                            onChange={(event) =>
                                form.setData('start_time', event.target.value)
                            }
                            className={inputClass}
                            required
                        />
                    </Field>
                    <Field
                        label="Jam selesai"
                        htmlFor="end_time"
                        error={form.errors.end_time}
                    >
                        <input
                            id="end_time"
                            type="time"
                            value={form.data.end_time}
                            onChange={(event) =>
                                form.setData('end_time', event.target.value)
                            }
                            className={inputClass}
                            required
                        />
                    </Field>
                    <Field
                        label="Uraian kegiatan"
                        htmlFor="description"
                        error={form.errors.description}
                        full
                    >
                        <RichTextEditor
                            value={form.data.description}
                            onChange={(html) =>
                                form.setData('description', html)
                            }
                        />
                    </Field>
                    <Field
                        label="Foto (opsional)"
                        htmlFor="image"
                        error={form.errors.image}
                        full
                    >
                        <input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                                form.setData(
                                    'image',
                                    event.target.files?.[0] ?? null,
                                )
                            }
                            className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                        />
                        {activity?.image && (
                            <a
                                href={activity.image}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-medium text-primary underline"
                            >
                                Lihat foto saat ini
                            </a>
                        )}
                    </Field>
                </div>
            </section>

            <div className="flex items-center justify-end gap-2">
                <Link
                    href={index.url()}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-surface"
                >
                    Batal
                </Link>
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                    {form.processing && (
                        <LoaderCircle className="size-4 animate-spin" />
                    )}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
