import { Link } from '@inertiajs/react';
import { GraduationCap, Mail, MapPin, Phone } from 'lucide-react';
import { create as login } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';

const navGroups: { title: string; links: { label: string; href: string }[] }[] =
    [
        {
            title: 'Produk',
            links: [
                { label: 'Fitur', href: '#fitur' },
                { label: 'Untuk siapa', href: '#peran' },
                { label: 'Cara kerja', href: '#alur' },
                { label: 'FAQ', href: '#faq' },
            ],
        },
        {
            title: 'Peran',
            links: [
                { label: 'Sekolah & Wakasek', href: '#peran' },
                { label: 'Guru & Pembimbing', href: '#peran' },
                { label: 'Siswa', href: '#peran' },
                { label: 'Industri / DUDI', href: '#peran' },
            ],
        },
    ];

const contacts = [
    { icon: Mail, label: 'admin@simonik.sch.id' },
    { icon: Phone, label: '(0274) 123-4567' },
    { icon: MapPin, label: 'SMK, Yogyakarta' },
];

export function SiteFooter() {
    return (
        <footer className="mt-10 border-t border-line/60 bg-surface">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
                                <GraduationCap className="size-5" />
                            </span>
                            <span className="leading-tight">
                                <span className="block text-lg font-extrabold tracking-tight text-ink">
                                    SIMONIK
                                </span>
                                <span className="block text-xs font-medium text-muted">
                                    Monitoring PKL
                                </span>
                            </span>
                        </div>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                            Satu sistem untuk memantau absensi, jurnal, dan
                            penilaian Praktik Kerja Lapangan siswa secara
                            real-time.
                        </p>
                        <Link
                            href={login.url()}
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:translate-y-px"
                        >
                            Masuk ke SIMONIK
                        </Link>
                    </div>

                    {navGroups.map((group) => (
                        <div key={group.title}>
                            <h3 className="text-sm font-bold text-ink">
                                {group.title}
                            </h3>
                            <ul className="mt-4 space-y-3 text-sm text-muted">
                                {group.links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="transition-colors hover:text-primary"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}

                    <div>
                        <h3 className="text-sm font-bold text-ink">Kontak</h3>
                        <ul className="mt-4 space-y-3 text-sm text-muted">
                            {contacts.map((contact) => {
                                const Icon = contact.icon;

                                return (
                                    <li
                                        key={contact.label}
                                        className="flex items-center gap-2.5"
                                    >
                                        <Icon className="size-4 shrink-0 text-primary" />
                                        {contact.label}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line/60 pt-6 text-sm text-muted sm:flex-row">
                    <span>
                        © {new Date().getFullYear()} SIMONIK · Sistem Monitoring
                        PKL
                    </span>
                    <span className="flex items-center gap-4">
                        <a
                            href="#"
                            className="transition-colors hover:text-primary"
                        >
                            Kebijakan Privasi
                        </a>
                        <a
                            href="#"
                            className="transition-colors hover:text-primary"
                        >
                            Syarat Layanan
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
}
