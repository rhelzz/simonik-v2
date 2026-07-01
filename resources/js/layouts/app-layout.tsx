import { Head, usePage } from '@inertiajs/react';
import { CheckCircle2, TriangleAlert, X } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppTopbar } from '@/components/app-topbar';
import { PwaPrompt } from '@/components/pwa/pwa-prompt';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';

export function AppLayout({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const { flash } = usePage<SharedData>().props;

    return (
        <div className="min-h-screen bg-canvas text-ink">
            <Head title={title} />

            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-hidden border-r border-line bg-surface lg:block">
                <AppSidebar />
            </aside>

            {/* Mobile drawer */}
            <div
                className={cn(
                    'fixed inset-0 z-40 lg:hidden',
                    mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
                )}
            >
                <div
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                        'absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity',
                        mobileOpen ? 'opacity-100' : 'opacity-0',
                    )}
                />
                <div
                    className={cn(
                        'absolute inset-y-0 left-0 w-72 max-w-[80%] overflow-hidden border-r border-line bg-surface shadow-xl transition-transform duration-300',
                        mobileOpen ? 'translate-x-0' : '-translate-x-full',
                    )}
                >
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        className="absolute top-4 right-4 z-10 grid size-8 place-items-center rounded-lg text-muted"
                        aria-label="Tutup menu"
                    >
                        <X className="size-5" />
                    </button>
                    <AppSidebar onNavigate={() => setMobileOpen(false)} />
                </div>
            </div>

            {/* Content */}
            <div className="lg:pl-64">
                <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6">
                    <AppTopbar
                        title={title}
                        onOpenSidebar={() => setMobileOpen(true)}
                    />
                    {flash.success && (
                        <div className="flex items-center gap-2 rounded-2xl bg-positive/10 px-4 py-3 text-sm font-medium text-positive">
                            <CheckCircle2 className="size-4 shrink-0" />
                            {flash.success}
                        </div>
                    )}
                    {flash.error && (
                        <div className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                            <TriangleAlert className="size-4 shrink-0" />
                            {flash.error}
                        </div>
                    )}
                    <main>{children}</main>
                </div>
            </div>

            <PwaPrompt />
        </div>
    );
}
