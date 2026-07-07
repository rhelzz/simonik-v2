import { Form, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    Eye,
    EyeOff,
    LoaderCircle,
    ShieldCheck,
    UserCircle2,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { update as updatePassword } from '@/actions/App/Http/Controllers/PasswordController';
import { update as updateProfile } from '@/actions/App/Http/Controllers/ProfileController';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import type { Role } from '@/types/auth';

type ProfileEditProps = {
    profile: { name: string; email: string };
};

const roleLabels: Record<Role, string> = {
    admin: 'Administrator',
    wakasek: 'Wakil Kepala Sekolah',
    kaprog: 'Kepala Program',
    guru: 'Guru Pembimbing',
    pembimbing: 'Pembimbing Industri',
    siswa: 'Siswa',
    orangtua: 'Orang Tua',
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';

    return (first + last).toUpperCase() || 'U';
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
            {children}
        </section>
    );
}

function Field({
    label,
    htmlFor,
    error,
    hint,
    required,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
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

function PasswordToggle({
    show,
    onToggle,
}: {
    show: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition-colors hover:text-ink"
            aria-label={
                show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
            }
        >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
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
    const { auth } = usePage<SharedData>().props;
    const roles = auth.roles ?? [];

    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const passwordMatch =
        password && confirmation ? password === confirmation : null;

    return (
        <AppLayout title="Pengaturan Akun">
            <div className="space-y-6">
                {/* Kartu identitas */}
                <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-[#3a3f9e] p-5 text-white sm:p-6">
                    <div className="absolute -top-16 -right-12 size-52 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex items-center gap-4">
                        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-extrabold backdrop-blur">
                            {initials(profile.name)}
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-xl font-extrabold tracking-tight">
                                {profile.name}
                            </h2>
                            <p className="truncate text-sm text-white/70">
                                {profile.email}
                            </p>
                            {roles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {roles.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur"
                                        >
                                            {roleLabels[role] ?? role}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                    {/* Informasi akun */}
                    <Section
                        icon={<UserCircle2 className="size-5" />}
                        title="Informasi akun"
                        description="Perbarui nama dan email akun Anda."
                    >
                        <Form
                            action={updateProfile.url()}
                            method="patch"
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Field
                                        label="Nama lengkap"
                                        htmlFor="name"
                                        error={errors.name}
                                        required
                                    >
                                        <input
                                            id="name"
                                            name="name"
                                            defaultValue={profile.name}
                                            placeholder="Nama lengkap Anda"
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
                                            defaultValue={profile.email}
                                            placeholder="nama@sekolah.sch.id"
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
                    </Section>

                    {/* Keamanan */}
                    <Section
                        icon={<ShieldCheck className="size-5" />}
                        title="Keamanan"
                        description="Gunakan kata sandi yang panjang dan unik agar akun tetap aman."
                    >
                        <Form
                            action={updatePassword.url()}
                            method="put"
                            resetOnSuccess
                            onSuccess={() => {
                                setPassword('');
                                setConfirmation('');
                            }}
                            className="space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Field
                                        label="Kata sandi saat ini"
                                        htmlFor="current_password"
                                        error={errors.current_password}
                                        required
                                    >
                                        <div className="relative">
                                            <input
                                                id="current_password"
                                                name="current_password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                autoComplete="current-password"
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                    </Field>
                                    <Field
                                        label="Kata sandi baru"
                                        htmlFor="password"
                                        error={errors.password}
                                        hint="Minimal 8 karakter."
                                        required
                                    >
                                        <div className="relative">
                                            <input
                                                id="password"
                                                name="password"
                                                type={
                                                    showPassword
                                                        ? 'text'
                                                        : 'password'
                                                }
                                                autoComplete="new-password"
                                                value={password}
                                                onChange={(e) =>
                                                    setPassword(e.target.value)
                                                }
                                                placeholder="Kata sandi baru"
                                                className={inputClass}
                                                required
                                            />
                                            <PasswordToggle
                                                show={showPassword}
                                                onToggle={() =>
                                                    setShowPassword(
                                                        !showPassword,
                                                    )
                                                }
                                            />
                                        </div>
                                    </Field>
                                    <Field
                                        label="Konfirmasi kata sandi baru"
                                        htmlFor="password_confirmation"
                                        required
                                    >
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="new-password"
                                            value={confirmation}
                                            onChange={(e) =>
                                                setConfirmation(e.target.value)
                                            }
                                            placeholder="Ulangi kata sandi baru"
                                            className={inputClass}
                                            required
                                        />
                                        {confirmation && (
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
                                    <div className="flex justify-end">
                                        <SubmitButton processing={processing}>
                                            Perbarui kata sandi
                                        </SubmitButton>
                                    </div>
                                </>
                            )}
                        </Form>
                    </Section>
                </div>
            </div>
        </AppLayout>
    );
}
