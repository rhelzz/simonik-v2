import { Link, usePage } from '@inertiajs/react';
import { GraduationCap, LogOut } from 'lucide-react';
import { navForRoles } from '@/lib/nav';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();
}

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const current = page.url;
    const sections = navForRoles(auth.roles);
    const primaryRole = auth.roles[0];

    return (
        <div className="flex h-full flex-col gap-6 bg-surface p-5">
            {/* Brand */}
            <Link
                href="/dashboard"
                onClick={onNavigate}
                className="flex items-center gap-3 px-1"
            >
                <span className="grid size-10 place-items-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
                    <GraduationCap className="size-5" />
                </span>
                <span className="leading-tight">
                    <span className="block text-base font-extrabold tracking-tight text-ink">
                        SIMONIK
                    </span>
                    <span className="block text-xs font-medium text-muted">
                        Monitoring PKL
                    </span>
                </span>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 space-y-6 overflow-y-auto">
                {sections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <p className="px-3 pb-1 text-[0.65rem] font-semibold tracking-[0.12em] text-muted uppercase">
                            {section.title}
                        </p>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const active = item.href
                                ? current.startsWith(item.href)
                                : false;

                            if (!item.href) {
                                return (
                                    <span
                                        key={item.label}
                                        aria-disabled="true"
                                        title="Segera hadir"
                                        className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted/70"
                                    >
                                        <Icon className="size-[1.15rem] shrink-0" />
                                        <span className="flex-1">
                                            {item.label}
                                        </span>
                                        <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[0.6rem] font-semibold text-muted">
                                            Soon
                                        </span>
                                    </span>
                                );
                            }

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                                        active
                                            ? 'bg-primary-soft text-primary'
                                            : 'text-ink/80 hover:bg-canvas hover:text-ink',
                                    )}
                                >
                                    <Icon className="size-[1.15rem] shrink-0" />
                                    <span className="flex-1">{item.label}</span>
                                    {active && (
                                        <span className="size-1.5 rounded-full bg-primary" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* User */}
            <div className="flex items-center gap-3 rounded-2xl bg-canvas p-3">
                <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
                    {auth.user ? initials(auth.user.name) : 'PK'}
                </span>
                <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-sm font-semibold text-ink">
                        {auth.user?.name ?? 'Mode demo'}
                    </span>
                    <span className="block truncate text-xs text-muted capitalize">
                        {primaryRole?.replace('_', ' ') ?? 'belum masuk'}
                    </span>
                </span>
                <button
                    type="button"
                    title="Keluar tersedia setelah modul autentikasi"
                    disabled
                    className="grid size-8 place-items-center rounded-lg text-muted disabled:opacity-40"
                >
                    <LogOut className="size-4" />
                </button>
            </div>
        </div>
    );
}
