import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/TeacherController';

export type DepartemenOption = { id: number; name: string };

export type TeacherDefaults = {
    name?: string;
    email?: string;
    no_hp?: string;
    departemen_id?: number;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

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

export function TeacherForm({
    action,
    method,
    departemens,
    teacher,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    departemens: DepartemenOption[];
    teacher?: TeacherDefaults;
    submitLabel: string;
}) {
    const isCreate = !teacher;

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Nama lengkap"
                                htmlFor="name"
                                error={errors.name}
                            >
                                <input
                                    id="name"
                                    name="name"
                                    defaultValue={teacher?.name}
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
                                    defaultValue={teacher?.email}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            {isCreate && (
                                <>
                                    <Field
                                        label="Kata sandi"
                                        htmlFor="password"
                                        error={errors.password}
                                    >
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            className={inputClass}
                                            required
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
                                            required
                                        />
                                    </Field>
                                </>
                            )}
                            <Field
                                label="No. HP"
                                htmlFor="no_hp"
                                error={errors.no_hp}
                            >
                                <input
                                    id="no_hp"
                                    name="no_hp"
                                    defaultValue={teacher?.no_hp}
                                    placeholder="08xxxxxxxxxx"
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Jurusan"
                                htmlFor="departemen_id"
                                error={errors.departemen_id}
                            >
                                <select
                                    id="departemen_id"
                                    name="departemen_id"
                                    defaultValue={teacher?.departemen_id ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih jurusan…
                                    </option>
                                    {departemens.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
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
