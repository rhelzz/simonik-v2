import { Form, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    Eye,
    EyeOff,
    LoaderCircle,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/WakasekController';

export type WakasekDefaults = {
    name?: string;
    email?: string;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function Field({
    label,
    htmlFor,
    error,
    hint,
    children,
    required,
    full,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
    required?: boolean;
    full?: boolean;
}) {
    return (
        <div className={full ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
            <label
                htmlFor={htmlFor}
                className="flex items-center gap-1 text-sm font-medium text-ink"
            >
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted">{hint}</p>}
            {error && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}

/** Card section with an icon badge, title and short description. */
function Section({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold text-ink">{title}</h3>
                    <p className="text-xs text-muted">{description}</p>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        </section>
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

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const passwordMatch =
        password && passwordConfirmation
            ? password === passwordConfirmation
            : null;

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <Section
                        icon={<ShieldCheck className="size-5" />}
                        title="Akun Wakasek Humas / Hubin"
                        description="Memegang fungsi administrasi makro, kemitraan, dan supervisi global."
                    >
                        <Field
                            label="Nama lengkap"
                            htmlFor="name"
                            error={errors.name}
                            required
                        >
                            <input
                                id="name"
                                name="name"
                                defaultValue={wakasek?.name}
                                placeholder="cth. Drs. Bambang"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="Email"
                            htmlFor="email"
                            error={errors.email}
                            required
                        >
                            <input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={wakasek?.email}
                                placeholder="nama@sekolah.sch.id"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label={isCreate ? 'Kata sandi' : 'Kata sandi baru'}
                            htmlFor="password"
                            error={errors.password}
                            hint={
                                isCreate
                                    ? undefined
                                    : 'Kosongkan jika tidak ingin mengubah.'
                            }
                            required={isCreate}
                        >
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    placeholder={
                                        isCreate ? 'Minimal 8 karakter' : ''
                                    }
                                    className={inputClass}
                                    required={isCreate}
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition-colors hover:text-ink"
                                    aria-label={
                                        showPassword
                                            ? 'Sembunyikan'
                                            : 'Tampilkan'
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                        </Field>
                        <Field
                            label="Konfirmasi kata sandi"
                            htmlFor="password_confirmation"
                            required={isCreate}
                        >
                            <input
                                id="password_confirmation"
                                name="password_confirmation"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                value={passwordConfirmation}
                                onChange={(e) =>
                                    setPasswordConfirmation(e.target.value)
                                }
                                className={inputClass}
                                required={isCreate}
                            />
                            {passwordConfirmation && (
                                <div
                                    className={`flex items-center gap-1.5 text-xs font-medium ${passwordMatch ? 'text-positive' : 'text-red-500'}`}
                                >
                                    {passwordMatch ? (
                                        <>
                                            <Check className="size-3.5" />
                                            Kata sandi cocok
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircle className="size-3.5" />
                                            Kata sandi tidak cocok
                                        </>
                                    )}
                                </div>
                            )}
                        </Field>
                    </Section>

                    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-2xl border border-line bg-surface/80 p-3 shadow-lg shadow-ink/5 backdrop-blur">
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
                </>
            )}
        </Form>
    );
}
