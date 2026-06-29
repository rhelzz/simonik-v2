import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
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
    action,
    method,
    activity,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    activity?: ActivityDefaults;
    submitLabel: string;
}) {
    const [description, setDescription] = useState(activity?.description ?? '');

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Judul kegiatan"
                                htmlFor="judul"
                                error={errors.judul}
                                full
                            >
                                <input
                                    id="judul"
                                    name="judul"
                                    defaultValue={activity?.judul}
                                    className={inputClass}
                                    placeholder="Mis. Membuat halaman login"
                                    required
                                />
                            </Field>
                            <Field
                                label="Tanggal"
                                htmlFor="date"
                                error={errors.date}
                            >
                                <input
                                    id="date"
                                    name="date"
                                    type="date"
                                    defaultValue={activity?.date}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Alat / tools"
                                htmlFor="tools"
                                error={errors.tools}
                            >
                                <input
                                    id="tools"
                                    name="tools"
                                    defaultValue={activity?.tools}
                                    className={inputClass}
                                    placeholder="Mis. Laptop, VS Code"
                                    required
                                />
                            </Field>
                            <Field
                                label="Waktu mulai"
                                htmlFor="start_time"
                                error={errors.start_time}
                            >
                                <input
                                    id="start_time"
                                    name="start_time"
                                    type="time"
                                    defaultValue={activity?.start_time}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Waktu selesai"
                                htmlFor="end_time"
                                error={errors.end_time}
                            >
                                <input
                                    id="end_time"
                                    name="end_time"
                                    type="time"
                                    defaultValue={activity?.end_time}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Uraian kegiatan"
                                htmlFor="description"
                                error={errors.description}
                                full
                            >
                                <RichTextEditor
                                    value={description}
                                    onChange={setDescription}
                                />
                                <input
                                    type="hidden"
                                    name="description"
                                    value={description}
                                />
                            </Field>
                            <Field
                                label="Foto (opsional)"
                                htmlFor="image"
                                error={errors.image}
                                full
                            >
                                <input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                                />
                                {activity?.image && (
                                    <img
                                        src={activity.image}
                                        alt="Foto kegiatan saat ini"
                                        className="mt-2 aspect-video w-48 rounded-xl border border-line object-cover"
                                    />
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
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            {processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            {submitLabel}
                        </button>
                    </div>
                </>
            )}
        </Form>
    );
}
