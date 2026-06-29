import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/ParentController';

export type ParentDefaults = {
    nama?: string;
    email?: string;
    gender?: string;
    alamat?: string;
    occupation?: string;
    phoneNumber?: string;
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

export function ParentForm({
    action,
    method,
    parent,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    parent?: ParentDefaults;
    submitLabel: string;
}) {
    const isCreate = !parent;

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Nama lengkap"
                                htmlFor="nama"
                                error={errors.nama}
                            >
                                <input
                                    id="nama"
                                    name="nama"
                                    defaultValue={parent?.nama}
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
                                    defaultValue={parent?.email}
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
                                label="Jenis kelamin"
                                htmlFor="gender"
                                error={errors.gender}
                            >
                                <select
                                    id="gender"
                                    name="gender"
                                    defaultValue={parent?.gender ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih…
                                    </option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </Field>
                            <Field
                                label="Pekerjaan"
                                htmlFor="occupation"
                                error={errors.occupation}
                            >
                                <input
                                    id="occupation"
                                    name="occupation"
                                    defaultValue={parent?.occupation}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="No. HP"
                                htmlFor="phoneNumber"
                                error={errors.phoneNumber}
                            >
                                <input
                                    id="phoneNumber"
                                    name="phoneNumber"
                                    defaultValue={parent?.phoneNumber}
                                    placeholder="08xxxxxxxxxx"
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Alamat"
                                htmlFor="alamat"
                                error={errors.alamat}
                                full
                            >
                                <textarea
                                    id="alamat"
                                    name="alamat"
                                    rows={2}
                                    defaultValue={parent?.alamat}
                                    className={inputClass}
                                    required
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
