import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/KaprogController';

export type DepartemenOption = {
    id: number;
    name: string;
    owner: string | null;
};

export type KaprogDefaults = {
    name?: string;
    email?: string;
    departemen_ids?: number[];
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function Field({
    label,
    htmlFor,
    error,
    hint,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
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

export function KaprogForm({
    action,
    method,
    kaprog,
    departemens,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    kaprog?: KaprogDefaults;
    departemens: DepartemenOption[];
    submitLabel: string;
}) {
    const isCreate = !kaprog;
    const selected = new Set(kaprog?.departemen_ids ?? []);

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <h2 className="text-base font-bold text-ink">
                            Akun Kepala Program Keahlian
                        </h2>
                        <p className="mt-1 text-sm text-muted">
                            Kaprog mengelola PKL di lingkup program keahliannya
                            (plotting, jadwal, koordinat & validasi cadangan).
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
                                    defaultValue={kaprog?.name}
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
                                    defaultValue={kaprog?.email}
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

                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <h3 className="text-base font-bold text-ink">
                            Program keahlian yang dipimpin
                        </h3>
                        <p className="mt-1 text-sm text-muted">
                            Pilih jurusan yang menjadi tanggung jawab kaprog
                            ini.
                        </p>
                        {errors.departemen_ids && (
                            <p className="mt-2 text-xs font-medium text-red-500">
                                {errors.departemen_ids}
                            </p>
                        )}

                        {departemens.length === 0 ? (
                            <p className="mt-4 rounded-2xl border border-dashed border-line py-8 text-center text-sm text-muted">
                                Belum ada jurusan terdaftar.
                            </p>
                        ) : (
                            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                {departemens.map((dep) => (
                                    <label
                                        key={dep.id}
                                        className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 px-4 py-3 text-sm transition-colors hover:border-primary/40"
                                    >
                                        <input
                                            type="checkbox"
                                            name="departemen_ids[]"
                                            value={dep.id}
                                            defaultChecked={selected.has(
                                                dep.id,
                                            )}
                                            className="size-4 rounded border-line text-primary focus:ring-primary/30"
                                        />
                                        <span className="flex-1">
                                            <span className="font-medium text-ink">
                                                {dep.name}
                                            </span>
                                            {dep.owner && (
                                                <span className="ml-2 text-xs text-warning">
                                                    dipegang: {dep.owner}
                                                </span>
                                            )}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        )}
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
