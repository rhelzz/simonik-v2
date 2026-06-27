import { Head } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';

export function AuthLayout({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
            <Head title={title} />
            <div className="w-full max-w-md">
                <div className="mb-6 flex flex-col items-center text-center">
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary text-white shadow-sm shadow-primary/30">
                        <GraduationCap className="size-6" />
                    </span>
                    <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
                        {title}
                    </h1>
                    <p className="mt-1 text-sm text-muted">{subtitle}</p>
                </div>
                <div className="rounded-3xl bg-surface p-6 shadow-sm shadow-ink/5 sm:p-8">
                    {children}
                </div>
            </div>
        </div>
    );
}
