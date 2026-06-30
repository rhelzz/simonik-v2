import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown, GraduationCap, LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { destroy as logout } from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import { edit as profile } from '@/actions/App/Http/Controllers/ProfileController';
import { navForRoles } from '@/lib/nav';
import { cn } from '@/lib/utils';
import type { NavItem, SharedData } from '@/types';

function initials(name: string): string {
    return name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join('')
        .toUpperCase();
}

const NAV_SCROLL_KEY = 'sidebar-nav-scroll';

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const current = page.url;
    const sections = navForRoles(auth.roles);
    const primaryRole = auth.roles[0];
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const saved = sessionStorage.getItem(NAV_SCROLL_KEY);

        if (saved && navRef.current) {
            navRef.current.scrollTop = Number(saved);
        }
    }, []);

    function saveScroll() {
        if (navRef.current) {
            sessionStorage.setItem(
                NAV_SCROLL_KEY,
                String(navRef.current.scrollTop),
            );
        }
    }

    return (
        <div className="flex h-full min-h-0 flex-col bg-surface">
            {/* Brand */}
            <Link
                href="/dashboard"
                onClick={onNavigate}
                className="flex shrink-0 items-center gap-3 px-5 pt-5 pb-1"
            >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-sm shadow-primary/30">
                    <GraduationCap className="size-5" />
                </span>
                <span className="min-w-0 leading-tight">
                    <span className="block truncate text-base font-extrabold tracking-tight text-ink">
                        SIMONIK
                    </span>
                    <span className="block truncate text-xs font-medium text-muted">
                        Monitoring PKL
                    </span>
                </span>
            </Link>

            {/* Navigation */}
            <nav
                ref={navRef}
                onScroll={saveScroll}
                className="mt-4 scrollbar-slim min-h-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-3 pb-2"
            >
                {sections.map((section) => (
                    <div key={section.title} className="space-y-1">
                        <p className="px-3 pb-1 text-[0.65rem] font-semibold tracking-[0.12em] text-muted uppercase">
                            {section.title}
                        </p>
                        {section.items.map((item) =>
                            item.children ? (
                                <NavGroup
                                    key={item.label}
                                    item={item}
                                    current={current}
                                    onNavigate={onNavigate}
                                />
                            ) : (
                                <NavLink
                                    key={item.label}
                                    item={item}
                                    current={current}
                                    onNavigate={onNavigate}
                                />
                            ),
                        )}
                    </div>
                ))}
            </nav>

            {/* User */}
            <div className="m-3 flex shrink-0 items-center gap-3 rounded-2xl bg-canvas p-3">
                <Link
                    href={profile.url()}
                    onClick={onNavigate}
                    title="Pengaturan akun"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-colors hover:opacity-80"
                >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white">
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
                </Link>
                <button
                    type="button"
                    onClick={() => router.post(logout.url())}
                    title="Keluar"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
                >
                    <LogOut className="size-4" />
                </button>
            </div>
        </div>
    );
}

function isActive(href: string | undefined, current: string): boolean {
    return href ? current.startsWith(href) : false;
}

function NavLink({
    item,
    current,
    onNavigate,
    nested = false,
}: {
    item: NavItem;
    current: string;
    onNavigate?: () => void;
    nested?: boolean;
}) {
    const Icon = item.icon;
    const active = isActive(item.href, current);

    if (!item.href) {
        return (
            <span
                aria-disabled="true"
                title="Segera hadir"
                className={cn(
                    'flex min-w-0 cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted/70',
                    nested && 'py-2',
                )}
            >
                <Icon className="size-[1.15rem] shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="shrink-0 rounded-full bg-canvas px-1.5 py-0.5 text-[0.6rem] font-semibold text-muted">
                    Soon
                </span>
            </span>
        );
    }

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={cn(
                'flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                nested && 'py-2',
                active
                    ? 'bg-primary-soft text-primary'
                    : 'text-ink/80 hover:bg-canvas hover:text-ink',
            )}
        >
            <Icon className="size-[1.15rem] shrink-0" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {active && (
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
            )}
        </Link>
    );
}

function NavGroup({
    item,
    current,
    onNavigate,
}: {
    item: NavItem;
    current: string;
    onNavigate?: () => void;
}) {
    const children = item.children ?? [];
    const hasActiveChild = children.some((child) =>
        isActive(child.href, current),
    );
    const [open, setOpen] = useState(hasActiveChild);
    const Icon = item.icon;

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className={cn(
                    'flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    hasActiveChild
                        ? 'text-primary'
                        : 'text-ink/80 hover:bg-canvas hover:text-ink',
                )}
            >
                <Icon className="size-[1.15rem] shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">
                    {item.label}
                </span>
                <ChevronDown
                    className={cn(
                        'size-4 shrink-0 transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>
            {open && (
                <div className="mt-1 ml-3 space-y-1 border-l border-line pl-2">
                    {children.map((child) => (
                        <NavLink
                            key={child.label}
                            item={child}
                            current={current}
                            onNavigate={onNavigate}
                            nested
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
