import { Form } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { store } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { AuthLayout } from '@/layouts/auth-layout';

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

export default function Login({ status }: { status?: string }) {
    return (
        <AuthLayout title="Masuk ke SIMONIK" subtitle="Sistem Monitoring PKL">
            {status && (
                <div className="mb-4 rounded-xl bg-positive/10 px-4 py-2 text-sm font-medium text-positive">
                    {status}
                </div>
            )}

            <Form
                action={store.url()}
                method="post"
                resetOnSuccess={['password']}
                className="space-y-4"
            >
                {({ processing, errors }) => (
                    <>
                        <Field
                            label="Email"
                            htmlFor="email"
                            error={errors.email}
                        >
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                autoFocus
                                placeholder="nama@sekolah.sch.id"
                                className={inputClass}
                            />
                        </Field>

                        <Field
                            label="Kata sandi"
                            htmlFor="password"
                            error={errors.password}
                        >
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                placeholder="••••••••"
                                className={inputClass}
                            />
                        </Field>

                        <label className="flex items-center gap-2 text-sm text-ink/80">
                            <input
                                type="checkbox"
                                name="remember"
                                className="size-4 rounded border-line text-primary focus:ring-primary/20"
                            />
                            Ingat saya
                        </label>

                        <button
                            type="submit"
                            disabled={processing}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            {processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Masuk
                        </button>
                    </>
                )}
            </Form>

            <p className="mt-6 text-center text-xs text-muted">
                Akun demo:{' '}
                <span className="font-medium text-ink">admin@simonik.test</span>{' '}
                / <span className="font-medium text-ink">password</span>
            </p>
        </AuthLayout>
    );
}
