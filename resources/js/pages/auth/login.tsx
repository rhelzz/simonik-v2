import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, Lock, Mail } from 'lucide-react';
import {  useEffect, useState } from 'react';
import type {ReactNode} from 'react';
import { store } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';

/** Bordered box with a leading icon, a small floating label, and the field below. */
function Field({
    label,
    error,
    icon,
    children,
    action,
}: {
    label: string;
    error?: string;
    icon: ReactNode;
    children: ReactNode;
    action?: ReactNode;
}) {
    return (
        <div>
            <div className="group flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5 transition-all focus-within:border-primary focus-within:shadow-lg focus-within:shadow-primary/10 focus-within:ring-2 focus-within:ring-primary/15">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-focus-within:bg-primary group-focus-within:text-white">
                    {icon}
                </span>
                <div className="min-w-0 flex-1">
                    <span className="block text-[11px] font-medium text-muted">
                        {label}
                    </span>
                    {children}
                </div>
                {action}
            </div>
            {error && (
                <p className="mt-1 px-1 text-xs font-medium text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
}

const inputClass =
    'w-full bg-transparent text-sm text-ink placeholder:text-muted/70 focus:outline-none';

export default function Login({ status }: { status?: string }) {
    const [showPassword, setShowPassword] = useState(false);
    /** Mobile-only welcome splash shown before the form. Hidden immediately on md+ via CSS. */
    const [showWelcome, setShowWelcome] = useState(true);
    const [leaving, setLeaving] = useState(false);

    const dismissWelcome = () => {
        setLeaving(true);
        window.setTimeout(() => setShowWelcome(false), 500);
    };


    // Auto-advance to the form after a short greeting.
    useEffect(() => {
        const timer = window.setTimeout(dismissWelcome, 3200);

        return () => window.clearTimeout(timer);
    }, []);

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-primary via-primary to-[#5d69df] p-4">
            <Head title="Masuk ke SIMONIK" />

            {/* Mobile-only welcome splash — greets the user, then slides away to reveal the form. Hidden on md+. */}
            {showWelcome && (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={dismissWelcome}
                    onKeyDown={dismissWelcome}
                    className={`absolute inset-0 z-30 flex flex-col items-center justify-center overflow-hidden bg-linear-to-br from-primary via-primary to-[#5d69df] px-8 text-center text-white transition-all duration-500 md:hidden ${
                        leaving
                            ? '-translate-y-6 opacity-0'
                            : 'translate-y-0 opacity-100'
                    }`}
                >
                    {/* soft decorative circles */}
                    <span className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-white/10" />
                    <span className="pointer-events-none absolute -bottom-20 -left-16 size-56 rounded-full bg-white/5" />

                    <div className="animate-welcome-pop flex items-center gap-3">
                        <span className="grid size-12 place-items-center rounded-full bg-white/20">
                            <span className="size-5 rounded-full bg-white" />
                        </span>
                        <span className="text-2xl font-bold tracking-wide">
                            SIMONIK
                        </span>
                    </div>

                    <img
                        src="/images/login-illustration.png"
                        alt="Ilustrasi selamat datang SIMONIK"
                        className="animate-welcome-float pointer-events-none mt-8 w-64 max-w-[70%] drop-shadow-2xl"
                        style={{ animationDelay: '0.3s' }}
                    />

                    <h2
                        className="animate-welcome-rise mt-6 text-3xl font-extrabold leading-tight"
                        style={{ animationDelay: '0.15s' }}
                    >
                        Kelola PKL
                        <br />
                        dengan mudah
                    </h2>
                    <p
                        className="animate-welcome-rise mt-3 max-w-xs text-sm text-white/75"
                        style={{ animationDelay: '0.3s' }}
                    >
                        Selamat datang kembali. Pantau seluruh kegiatan Praktik
                        Kerja Lapangan dalam satu tempat.
                    </p>

                    <button
                        type="button"
                        onClick={dismissWelcome}
                        style={{ animationDelay: '0.5s' }}
                        className="animate-welcome-rise mt-8 flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-primary shadow-lg shadow-black/10 transition-transform active:scale-95"
                    >
                        Mulai
                        <ArrowRight className="size-4" />
                    </button>

                    <span className="animate-welcome-rise absolute bottom-8 text-xs text-white/50" style={{ animationDelay: '0.7s' }}>
                        Ketuk di mana saja untuk melanjutkan
                    </span>
                </div>
            )}

            {/* decorative page background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                {/* soft glows for depth */}
                <div className="absolute -left-40 -top-40 size-128 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-48 -right-40 size-144 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute right-1/4 top-10 size-64 rounded-full bg-accent/10 blur-3xl" />

                {/* flowing wave lines — top-right cluster */}
                <svg
                    className="absolute -right-20 -top-24 h-144 w-xl text-white/15"
                    viewBox="0 0 500 500"
                    fill="none"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {Array.from({ length: 7 }).map((_, i) => (
                        <path
                            key={i}
                            d={`M${-40 + i * 18} 0 C ${120 + i * 14} ${120 + i * 10}, ${40 + i * 20} ${240 + i * 12}, ${220 + i * 16} ${340 + i * 10} S ${460 + i * 8} ${420 + i * 8}, ${520 + i * 6} ${520}`}
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                    ))}
                </svg>

                {/* flowing wave lines — bottom-left cluster */}
                <svg
                    className="absolute -bottom-24 -left-24 h-144 w-xl text-white/15"
                    viewBox="0 0 500 500"
                    fill="none"
                    preserveAspectRatio="xMidYMid meet"
                >
                    {Array.from({ length: 7 }).map((_, i) => (
                        <path
                            key={i}
                            d={`M0 ${520 - i * 18} C ${140 + i * 12} ${380 - i * 10}, ${240 - i * 14} ${260 - i * 8}, ${340 + i * 12} ${160 - i * 10} S ${480 + i * 6} ${60 - i * 8}, ${540} ${-20 + i * 6}`}
                            stroke="currentColor"
                            strokeWidth="2"
                        />
                    ))}
                </svg>

                {/* scattered floating circles */}
                <span className="absolute left-16 top-24 size-3 rounded-full bg-white/50" />
                <span className="absolute left-1/3 top-12 size-2 rounded-full bg-white/40" />
                <span className="absolute right-24 top-32 size-4 rounded-full bg-white/40" />
                <span className="absolute right-1/3 bottom-16 size-2.5 rounded-full bg-white/50" />
                <span className="absolute bottom-24 left-24 size-3 rounded-full bg-white/40" />
                <span className="absolute bottom-1/3 right-16 size-2 rounded-full bg-white/50" />
                <span className="absolute left-1/2 bottom-10 size-2.5 rounded-full bg-accent/50" />
                <span className="absolute right-10 top-1/2 size-3 rounded-full bg-white/30" />
            </div>

            <div className="relative w-full max-w-4xl overflow-hidden rounded-4xl bg-surface shadow-xl shadow-ink/10">
                <div className="grid md:grid-cols-2">
                    {/* Left — branded panel with illustration */}
                    <div className="relative hidden flex-col justify-between bg-primary p-10 text-white md:flex">
                        {/* gradient wash */}
                        <span className="pointer-events-none absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-black/15" />
                        {/* flowing wave lines */}
                        <svg
                            className="pointer-events-none absolute inset-0 size-full text-white/10"
                            viewBox="0 0 400 500"
                            preserveAspectRatio="none"
                            fill="none"
                        >
                            <path
                                d="M-20 120 C 80 60, 160 180, 260 120 S 420 80, 460 160"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            <path
                                d="M-20 200 C 80 140, 160 260, 260 200 S 420 160, 460 240"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                            <path
                                d="M-20 360 C 100 300, 180 420, 280 360 S 420 320, 460 400"
                                stroke="currentColor"
                                strokeWidth="2"
                            />
                        </svg>
                        {/* decorative circles */}
                        <span className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10" />
                        <span className="pointer-events-none absolute right-8 top-24 size-3 rounded-full bg-white/40" />
                        <span className="pointer-events-none absolute bottom-16 right-10 size-6 rounded-full bg-white/20" />
                        <span className="pointer-events-none absolute -bottom-12 -left-12 size-44 rounded-full bg-white/5" />
                        <span className="pointer-events-none absolute left-8 top-1/2 size-2 rounded-full bg-white/40" />

                        <div className="relative flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-full bg-white/20">
                                <span className="size-4 rounded-full bg-white" />
                            </span>
                            <span className="text-lg font-semibold">SIMONIK</span>
                        </div>

                        <div className="relative">
                            <h2 className="text-3xl font-extrabold leading-tight">
                                Kelola PKL
                                <br />
                                dengan mudah
                            </h2>
                            <p className="mt-3 max-w-xs text-sm text-white/70">
                                Selamat datang kembali. Pantau dan kelola seluruh
                                kegiatan Praktik Kerja Lapangan dalam satu tempat.
                            </p>
                        </div>

                        {/* illustration — fixed-height frame; image can grow without resizing the container */}
                        <div className="relative -mx-10 -mb-10 mt-4 h-56 overflow-hidden">
                            <img
                                src="/images/login-illustration.png"
                                alt="Ilustrasi login SIMONIK"
                                className="absolute -top-10 left-1/2 w-full max-w-none -translate-x-1/2 translate-y-0 drop-shadow-xl"
                                style={{
                                    maskImage:
                                        'linear-gradient(to bottom, black 78%, transparent 100%)',
                                    WebkitMaskImage:
                                        'linear-gradient(to bottom, black 78%, transparent 100%)',
                                }}
                            />
                        </div>
                    </div>

                    {/* Right — form panel */}
                    <div className="flex flex-col justify-center p-8 sm:p-12">
                        <h1 className="text-3xl font-extrabold tracking-tight text-ink">
                            Login
                        </h1>
                        <p className="mt-1.5 text-sm text-muted">
                            Masuk ke akun Anda untuk melanjutkan.
                        </p>

                        {status && (
                            <div className="mt-4 rounded-xl bg-positive/10 px-4 py-2 text-sm font-medium text-positive">
                                {status}
                            </div>
                        )}

                        <Form
                            action={store.url()}
                            method="post"
                            resetOnSuccess={['password']}
                            className="mt-6 space-y-4"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <Field
                                        label="Email"
                                        error={errors.email}
                                        icon={<Mail className="size-4" />}
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
                                        label="Password"
                                        error={errors.password}
                                        icon={<Lock className="size-4" />}
                                        action={
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        (prev) => !prev,
                                                    )
                                                }
                                                className="shrink-0 text-muted transition-colors hover:text-ink"
                                                aria-label={
                                                    showPassword
                                                        ? 'Sembunyikan kata sandi'
                                                        : 'Tampilkan kata sandi'
                                                }
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="size-4" />
                                                ) : (
                                                    <Eye className="size-4" />
                                                )}
                                            </button>
                                        }
                                    >
                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="current-password"
                                            required
                                            placeholder="••••••••"
                                            className={inputClass}
                                        />
                                    </Field>

                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-2 text-sm text-ink/80">
                                            <input
                                                type="checkbox"
                                                name="remember"
                                                className="size-4 rounded border-line text-primary focus:ring-primary/20"
                                            />
                                            Ingat saya
                                        </label>
                                        <Link
                                            href="#"
                                            className="text-sm font-medium text-primary hover:underline"
                                        >
                                            Lupa password?
                                        </Link>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/40 active:scale-[0.99] disabled:opacity-60"
                                    >
                                        {processing && (
                                            <LoaderCircle className="size-4 animate-spin" />
                                        )}
                                        Login
                                    </button>
                                </>
                            )}
                        </Form>

                        <p className="mt-8 text-center text-sm text-muted">
                            Belum punya akun?{' '}
                            <Link
                                href="#"
                                className="font-semibold text-primary hover:underline"
                            >
                                Hubungi admin
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
