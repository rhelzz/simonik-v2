import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

type PaginationMeta = Pick<
    Paginated<unknown>,
    'links' | 'current_page' | 'last_page'
>;

export function Pagination({ meta }: { meta: PaginationMeta }) {
    if (meta.last_page <= 1) {
        return null;
    }

    const numbered = meta.links.slice(1, -1);

    return (
        <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-muted">
                Hal. {meta.current_page} dari {meta.last_page}
            </p>
            <div className="flex items-center gap-1">
                <PageLink url={meta.links[0]?.url ?? null} ariaLabel="Sebelumnya">
                    <ChevronLeft className="size-4" />
                </PageLink>
                {numbered.map((link, i) => (
                    <PageLink key={i} url={link.url} active={link.active}>
                        {link.label}
                    </PageLink>
                ))}
                <PageLink
                    url={meta.links[meta.links.length - 1]?.url ?? null}
                    ariaLabel="Berikutnya"
                >
                    <ChevronRight className="size-4" />
                </PageLink>
            </div>
        </div>
    );
}

function PageLink({
    url,
    active = false,
    ariaLabel,
    children,
}: {
    url: string | null;
    active?: boolean;
    ariaLabel?: string;
    children: ReactNode;
}) {
    const className = cn(
        'grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm font-medium',
        active ? 'bg-primary text-white' : 'text-ink/80 hover:bg-canvas',
        !url && 'pointer-events-none opacity-40',
    );

    if (!url) {
        return (
            <span className={className} aria-label={ariaLabel}>
                {children}
            </span>
        );
    }

    return (
        <Link href={url} preserveScroll aria-label={ariaLabel} className={className}>
            {children}
        </Link>
    );
}
