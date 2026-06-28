import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    Building2,
    Fingerprint,
    GraduationCap,
    MapPin,
    NotebookPen,
    ShieldCheck,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { create as login } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';

const features: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    desc: string;
}[] = [
    {
        icon: Fingerprint,
        title: 'Absensi & geolokasi',
        desc: 'Kehadiran siswa terekam lengkap dengan foto, lokasi, dan jam masuk/pulang.',
    },
    {
        icon: NotebookPen,
        title: 'Jurnal kegiatan',
        desc: 'Siswa menulis jurnal harian PKL dengan editor lengkap, kapan saja.',
    },
    {
        icon: BadgeCheck,
        title: 'Verifikasi pembimbing',
        desc: 'Pembimbing & industri memverifikasi kehadiran dan jurnal siswa bimbingannya.',
    },
    {
        icon: Building2,
        title: 'Data penempatan',
        desc: 'Kelola siswa, jurusan, kelas, industri, guru, dan pembimbing dalam satu tempat.',
    },
];

export default function Welcome() {
    return (
        <>
            <Head title="SIMONIK — Sistem Monitoring PKL" />

            <div className="min-h-screen bg-canvas text-ink">
                <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
                    <div className="flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
                            <GraduationCap className="size-5" />
                        </span>
                        <span className="leading-tight">
                            <span className="block text-lg font-extrabold tracking-tight">
                                SIMONIK
                            </span>
                            <span className="block text-xs font-medium text-muted">
                                Monitoring PKL
                            </span>
                        </span>
                    </div>
                    <Link
                        href={login.url()}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        Masuk
                        <ArrowRight className="size-4" />
                    </Link>
                </header>

                <main className="mx-auto max-w-6xl px-6">
                    {/* Hero */}
                    <section className="grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                                <ShieldCheck className="size-3.5" />
                                Sistem Monitoring PKL Sekolah
                            </span>
                            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                                Pantau Praktik Kerja Lapangan{' '}
                                <span className="text-primary">
                                    dalam satu layar
                                </span>
                            </h1>
                            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
                                SIMONIK menyatukan absensi, jurnal kegiatan,
                                penempatan industri, dan verifikasi pembimbing —
                                agar sekolah, guru, dan mitra industri memantau
                                PKL siswa secara real-time.
                            </p>
                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link
                                    href={login.url()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                                >
                                    Masuk ke SIMONIK
                                    <ArrowRight className="size-4" />
                                </Link>
                                <a
                                    href="#fitur"
                                    className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-6 py-3 text-sm font-semibold text-ink/80 transition-colors hover:bg-primary-soft hover:text-primary"
                                >
                                    Lihat fitur
                                </a>
                            </div>
                        </div>

                        {/* Hero visual */}
                        <div className="relative">
                            <div className="rounded-3xl bg-surface p-6 shadow-xl shadow-primary/5">
                                <div className="flex items-center gap-3 border-b border-line pb-4">
                                    <span className="grid size-10 place-items-center rounded-full bg-positive/15 text-positive">
                                        <BadgeCheck className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-ink">
                                            Kehadiran terverifikasi
                                        </p>
                                        <p className="text-xs text-muted">
                                            Hari ini · 07:28 · di lokasi
                                            industri
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 space-y-3">
                                    <HeroRow
                                        icon={MapPin}
                                        label="Lokasi absensi"
                                        value="Terkonfirmasi GPS"
                                    />
                                    <HeroRow
                                        icon={NotebookPen}
                                        label="Jurnal hari ini"
                                        value="Sudah diisi"
                                    />
                                    <HeroRow
                                        icon={Building2}
                                        label="Tempat PKL"
                                        value="PT Maju Teknologi"
                                    />
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-3 hidden rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg sm:block">
                                100% terpantau
                            </div>
                        </div>
                    </section>

                    {/* Features */}
                    <section id="fitur" className="scroll-mt-8 py-12">
                        <h2 className="text-center text-2xl font-bold text-ink">
                            Semua kebutuhan monitoring PKL
                        </h2>
                        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted">
                            Dari pendataan siswa sampai verifikasi industri,
                            dirancang untuk semua peran di ekosistem PKL.
                        </p>
                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature) => {
                                const Icon = feature.icon;

                                return (
                                    <div
                                        key={feature.title}
                                        className="rounded-3xl bg-surface p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5"
                                    >
                                        <span className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                                            <Icon className="size-5" />
                                        </span>
                                        <h3 className="mt-4 text-base font-bold text-ink">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-muted">
                                            {feature.desc}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="py-12">
                        <div className="rounded-3xl bg-primary px-6 py-12 text-center text-white sm:px-12">
                            <h2 className="text-2xl font-bold sm:text-3xl">
                                Siap memantau PKL lebih rapi?
                            </h2>
                            <p className="mx-auto mt-3 max-w-xl text-sm text-white/80">
                                Masuk dengan akun yang diberikan sekolah untuk
                                mulai mengelola dan memantau kegiatan PKL.
                            </p>
                            <Link
                                href={login.url()}
                                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                            >
                                Masuk sekarang
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </section>
                </main>

                <footer className="mx-auto max-w-6xl px-6 py-8 text-center text-sm text-muted">
                    © {new Date().getFullYear()} SIMONIK · Sistem Monitoring PKL
                </footer>
            </div>
        </>
    );
}

function HeroRow({
    icon: Icon,
    label,
    value,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl bg-canvas/60 px-4 py-3">
            <span className="flex items-center gap-2 text-sm text-muted">
                <Icon className="size-4" />
                {label}
            </span>
            <span className="text-sm font-semibold text-ink">{value}</span>
        </div>
    );
}
