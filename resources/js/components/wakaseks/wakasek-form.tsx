import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/WakasekController';

export type WakasekDefaults = {
    name?: string;
    email?: string;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function Field({
    label,
    htmlFor,
    error,
    hint,
    children,
    full,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    hint?: string;
    children: ReactNode;
    full?: boolean;
}) {
    return (
        <div className={full ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted">{hint}</p>}
            {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
}

export function WakasekForm({
    action,
    method,
    wakasek,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    wakasek?: WakasekDefaults;
    submitLabel: string;
}) {
    const isCreate = !wakasek;

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <h2 className="text-base font-bold text-ink">
                            Akun Wakasek Humas/Hubin
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            Akun ini memegang fungsi administrasi makro,
                            kemitraan, dan supervisi global.
                        </p>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Nama lengkap"
                                htmlFor="name"
                                error={errors.name}
                            >
                                <input
                                    id="name"
                                    name="name"
                                    defaultValue={wakasek?.name}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Email"
                                htmlFor="email"
                                error={errors.email}
                            >
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={wakasek?.email}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label={
                                    isCreate
                                        ? 'Kata sandi'
                                        : 'Kata sandi baru (opsional)'
                                }
                                htmlFor="password"
                                error={errors.password}
                                hint={
                                    isCreate
                                        ? undefined
                                        : 'Kosongkan bila tidak ingin mengganti.'
                                }
                            >
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    className={inputClass}
                                    required={isCreate}
                                />
                            </Field>
                            <Field
                                label="Konfirmasi kata sandi"
                                htmlFor="password_confirmation"
                            >
                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    className={inputClass}
                                    required={isCreate}
                                />
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
