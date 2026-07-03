import { Form, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    Eye,
    EyeOff,
    LoaderCircle,
    UserCircle2,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/ParentController';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';

export type ParentDefaults = {
    nama?: string;
    email?: string;
    gender?: string;
    alamat?: string;
    occupation?: string;
    phoneNumber?: string;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

/** Normalize varied stored gender values to the form's 'L' / 'P'. */
function normalizeGender(value?: string | null): string {
    switch ((value ?? '').toLowerCase()) {
        case 'male':
        case 'm':
        case 'l':
            return 'L';
        case 'female':
        case 'f':
        case 'p':
            return 'P';
        default:
            return '';
    }
}

function Field({
    label,
    htmlFor,
    error,
    children,
    hint,
    required,
    full,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
    hint?: string;
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

    const [gender, setGender] = useState(normalizeGender(parent?.gender));
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const passwordMatch =
        password && passwordConfirmation
            ? password === passwordConfirmation
            : null;

    const genderOptions: SelectOption[] = [
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' },
    ];

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <Section
                        icon={<UserCircle2 className="size-5" />}
                        title="Data orang tua / wali"
                        description="Identitas, akun login, dan kontak orang tua siswa."
                    >
                        <Field
                            label="Nama lengkap"
                            htmlFor="nama"
                            error={errors.nama}
                            required
                        >
                            <input
                                id="nama"
                                name="nama"
                                defaultValue={parent?.nama}
                                placeholder="cth. Bapak Slamet"
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
                                defaultValue={parent?.email}
                                placeholder="nama@email.com"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="Jenis kelamin"
                            error={errors.gender}
                            required
                        >
                            <Select
                                name="gender"
                                ariaLabel="Jenis kelamin"
                                value={gender}
                                options={genderOptions}
                                onChange={setGender}
                                placeholder="Pilih jenis kelamin…"
                            />
                        </Field>
                        <Field
                            label="Pekerjaan"
                            htmlFor="occupation"
                            error={errors.occupation}
                            required
                        >
                            <input
                                id="occupation"
                                name="occupation"
                                defaultValue={parent?.occupation}
                                placeholder="cth. Wiraswasta"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="No. HP"
                            htmlFor="phoneNumber"
                            error={errors.phoneNumber}
                            required
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
                            required
                        >
                            <textarea
                                id="alamat"
                                name="alamat"
                                rows={2}
                                defaultValue={parent?.alamat}
                                placeholder="Alamat tempat tinggal"
                                className={inputClass}
                                required
                            />
                        </Field>

                        {isCreate ? (
                            <>
                                <Field
                                    label="Kata sandi"
                                    htmlFor="password"
                                    error={errors.password}
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
                                            placeholder="Minimal 8 karakter"
                                            className={inputClass}
                                            required
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
                                    required
                                >
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete="new-password"
                                        value={passwordConfirmation}
                                        onChange={(e) =>
                                            setPasswordConfirmation(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Ulangi kata sandi"
                                        className={inputClass}
                                        required
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
                            </>
                        ) : (
                            <Field
                                label="Kata sandi baru"
                                htmlFor="password"
                                error={errors.password}
                                hint="Kosongkan jika tidak ingin mengubah."
                                full
                            >
                                <div className="relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        className={inputClass}
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
                        )}
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

                    {/* Bottom whitespace so the gender dropdown has room to open. */}
                    <div aria-hidden className="h-20" />
                </>
            )}
        </Form>
    );
}
