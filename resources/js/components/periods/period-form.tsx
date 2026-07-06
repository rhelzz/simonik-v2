import { Form, Link } from '@inertiajs/react';
import { AlertCircle, CalendarRange, LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/PeriodController';

export type PeriodDefaults = {
    id: number;
    name_period: string;
    start_period: string | null;
    end_period: string | null;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export function PeriodForm({
    action,
    method,
    period,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    period?: PeriodDefaults;
    submitLabel: string;
}) {
    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                                <CalendarRange className="size-5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-ink">
                                    Data periode PKL
                                </h3>
                                <p className="text-xs text-muted">
                                    Nama gelombang dan rentang tanggal
                                    pelaksanaan.
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Nama periode"
                                htmlFor="name_period"
                                error={errors.name_period}
                                required
                                full
                            >
                                <input
                                    id="name_period"
                                    name="name_period"
                                    defaultValue={period?.name_period}
                                    placeholder="mis. Gelombang 1 - 2026"
                                    className={inputClass}
                                    autoFocus
                                    required
                                />
                            </Field>
                            <Field
                                label="Tanggal mulai"
                                htmlFor="start_period"
                                error={errors.start_period}
                                required
                            >
                                <input
                                    id="start_period"
                                    name="start_period"
                                    type="date"
                                    defaultValue={period?.start_period ?? ''}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Tanggal selesai"
                                htmlFor="end_period"
                                error={errors.end_period}
                                required
                            >
                                <input
                                    id="end_period"
                                    name="end_period"
                                    type="date"
                                    defaultValue={period?.end_period ?? ''}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                        </div>
                    </section>

                    <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-2xl border border-line bg-surface/80 p-3 backdrop-blur">
                        <Link
                            href={index.url()}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
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
    full,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    required?: boolean;
    full?: boolean;
    children: ReactNode;
}) {
    return (
        <div className={full ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
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
