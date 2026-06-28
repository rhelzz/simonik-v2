import { Form } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { update as updatePassword } from '@/actions/App/Http/Controllers/PasswordController';
import { update as updateProfile } from '@/actions/App/Http/Controllers/ProfileController';
import { AppLayout } from '@/layouts/app-layout';

type ProfileEditProps = {
    profile: { name: string; email: string };
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

function SubmitButton({
    processing,
    children,
}: {
    processing: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
            {processing && <LoaderCircle className="size-4 animate-spin" />}
            {children}
        </button>
    );
}

export default function ProfileEdit({ profile }: ProfileEditProps) {
    return (
        <AppLayout title="Pengaturan Akun">
            <div className="grid max-w-3xl gap-6">
                {/* Informasi akun */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="text-base font-bold text-ink">
                        Informasi akun
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Perbarui nama dan email akun Anda.
                    </p>

                    <Form
                        action={updateProfile.url()}
                        method="patch"
                        className="mt-5 space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <Field
                                    label="Nama lengkap"
                                    htmlFor="name"
                                    error={errors.name}
                                >
                                    <input
                                        id="name"
                                        name="name"
                                        defaultValue={profile.name}
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
                                        defaultValue={profile.email}
                                        className={inputClass}
                                        required
                                    />
                                </Field>
                                <div className="flex justify-end">
                                    <SubmitButton processing={processing}>
                                        Simpan perubahan
                                    </SubmitButton>
                                </div>
                            </>
                        )}
                    </Form>
                </section>

                {/* Ganti kata sandi */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="text-base font-bold text-ink">
                        Ganti kata sandi
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                        Gunakan kata sandi yang panjang dan unik agar akun tetap
                        aman.
                    </p>

                    <Form
                        action={updatePassword.url()}
                        method="put"
                        resetOnSuccess
                        className="mt-5 space-y-4"
                    >
                        {({ processing, errors }) => (
                            <>
                                <Field
                                    label="Kata sandi saat ini"
                                    htmlFor="current_password"
                                    error={errors.current_password}
                                >
                                    <input
                                        id="current_password"
                                        name="current_password"
                                        type="password"
                                        autoComplete="current-password"
                                        className={inputClass}
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Kata sandi baru"
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
                                    label="Konfirmasi kata sandi baru"
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
                                <div className="flex justify-end">
                                    <SubmitButton processing={processing}>
                                        Perbarui kata sandi
                                    </SubmitButton>
                                </div>
                            </>
                        )}
                    </Form>
                </section>
            </div>
        </AppLayout>
    );
}
