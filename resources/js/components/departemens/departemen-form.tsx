import { Form, Link } from '@inertiajs/react';
import { AlertCircle, FolderTree, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/DepartemenController';

export type DepartemenDefaults = {
    id: number;
    name: string;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export function DepartemenForm({
    action,
    method,
    departemen,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    departemen?: DepartemenDefaults;
    submitLabel: string;
}) {
    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                                <FolderTree className="size-5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-ink">
                                    Data jurusan
                                </h3>
                                <p className="text-xs text-muted">
                                    Nama program keahlian / jurusan.
                                </p>
                            </div>
                        </div>
                        <div className="mt-5">
                            <Field
                                label="Nama jurusan"
                                htmlFor="name"
                                error={errors.name}
                                required
                            >
                                <input
                                    id="name"
                                    name="name"
                                    defaultValue={departemen?.name}
                                    placeholder="mis. Rekayasa Perangkat Lunak"
                                    className={inputClass}
                                    autoFocus
                                    required
                                />
                            </Field>
                        </div>
                    </section>

                    <ActionBar
                        cancelHref={index.url()}
                        processing={processing}
                        submitLabel={submitLabel}
                    />
                    <div className="h-20" />
                </>
            )}
        </Form>
    );
}

function Field({
    label,
    htmlFor,
    error,
    required,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="size-3.5" />
                    {error}
                </p>
            )}
        </div>
    );
}

function ActionBar({
    cancelHref,
    processing,
    submitLabel,
}: {
    cancelHref: string;
    processing: boolean;
    submitLabel: string;
}) {
    return (
        <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-2xl border border-line bg-surface/80 p-3 backdrop-blur">
            <Link
                href={cancelHref}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
            >
                Batal
            </Link>
            <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
                {processing && <LoaderCircle className="size-4 animate-spin" />}
                {submitLabel}
            </button>
        </div>
    );
}
