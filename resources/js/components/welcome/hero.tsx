import { Link } from '@inertiajs/react';
import { ArrowRight, BadgeCheck, MapPin, Sparkles } from 'lucide-react';
import { create as login } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';

export function Hero() {
    return (
        <section className="relative py-10 lg:py-16">
            {/* Warm coral + primary wash to lift the hero out of the cool lavender canvas */}
            <div
                aria-hidden
                className="absolute -top-20 -right-24 -z-10 size-128 rounded-full bg-accent/25 blur-[90px]"
            />
            <div
                aria-hidden
                className="absolute -bottom-24 -left-20 -z-10 size-96 rounded-full bg-primary/20 blur-[90px]"
            />

            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
                <div className="rise">
                    <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-1.5 text-xs font-semibold text-accent">
                        <Sparkles className="size-3.5" />
                        Sistem Monitoring PKL Sekolah
                    </span>
                    <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl">
                        Pantau PKL siswa,{' '}
                        <span className="relative whitespace-nowrap text-primary">
                            satu layar
                            <svg
                                aria-hidden
                                viewBox="0 0 300 12"
                                preserveAspectRatio="none"
                                className="absolute -bottom-1 left-0 h-3 w-full text-accent"
                            >
                                <path
                                    d="M2 8C60 3 240 3 298 8"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </span>
                    </h1>
                    <p className="mt-6 max-w-lg text-base leading-relaxed text-muted lg:text-lg">
                        Absensi, jurnal kegiatan, penempatan industri, dan
                        verifikasi pembimbing dalam satu tempat agar sekolah,
                        guru, dan mitra industri memantau PKL secara real-time.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            href={login.url()}
                            className="inline-flex items-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/30 transition-all hover:brightness-95 active:translate-y-px"
                        >
                            Masuk ke SIMONIK
                            <ArrowRight className="size-4" />
                        </Link>
                        <a
                            href="#fitur"
                            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-7 py-3.5 text-sm font-semibold text-ink/80 transition-colors hover:bg-primary-soft hover:text-primary active:translate-y-px"
                        >
                            Lihat fitur
                        </a>
                    </div>
                </div>

                <div className="rise-delay relative mx-auto w-full max-w-sm lg:max-w-none">
                    {/* Contextual imagery — placeholder. Swap for a real photo of students
                        on placement / a teacher reviewing attendance. */}
                    <div className="relative overflow-hidden rounded-4xl bg-primary-soft shadow-xl shadow-primary/10">
                        <img
                            src="/images/hero-section.jpg"
                            alt="Siswa PKL sedang praktik di lokasi industri"
                            loading="lazy"
                            className="aspect-square w-full object-cover sm:aspect-4/5 lg:max-h-110"
                        />
                        <div
                            aria-hidden
                            className="absolute inset-0 bg-linear-to-t from-ink/40 via-transparent to-transparent"
                        />
                    </div>

                    {/* Floating verification card overlapping the image */}
                    <div className="absolute -bottom-5 -left-4 w-56 rounded-2xl bg-surface p-4 shadow-xl shadow-primary/10 sm:w-64 sm:-left-8">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-positive/15 text-positive">
                                <BadgeCheck className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold text-ink">
                                    Kehadiran terverifikasi
                                </p>
                                <p className="flex items-center gap-1 text-xs text-muted">
                                    <MapPin className="size-3" />
                                    07:28 · di lokasi industri
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="absolute -top-4 -right-3 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/30">
                        100% terpantau
                    </div>
                </div>
            </div>
        </section>
    );
}
