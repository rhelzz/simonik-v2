import { Link } from '@inertiajs/react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { create as login } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';

const links = [
    { href: '#fitur', label: 'Fitur' },
    { href: '#peran', label: 'Untuk siapa' },
    { href: '#alur', label: 'Cara kerja' },
    { href: '#faq', label: 'FAQ' },
];

export function Navbar() {
    return (
        <header className="sticky top-0 z-10 border-b border-line/60 bg-canvas/80 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
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
                <nav className="hidden items-center gap-8 text-sm font-medium text-muted md:flex">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="relative transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-primary after:transition-all after:duration-300 hover:text-primary hover:after:w-full"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>
                <Link
                    href={login.url()}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:translate-y-px"
                >
                    Masuk
                    <ArrowRight className="size-4" />
                </Link>
            </div>
        </header>
    );
}
