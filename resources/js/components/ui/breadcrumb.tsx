import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';

export type Crumb = {
    label: string;
    href?: string;
};

/**
 * Jejak navigasi berjenjang. Item dengan `href` jadi tautan; item terakhir
 * (atau tanpa `href`) dirender sebagai teks aktif.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
    return (
        <nav className="flex flex-wrap items-center gap-1 text-sm text-muted">
            {items.map((item, index) => {
                const last = index === items.length - 1;

                return (
                    <Fragment key={`${item.label}-${index}`}>
                        {item.href && !last ? (
                            <Link
                                href={item.href}
                                prefetch
                                className="font-medium transition-colors hover:text-primary"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="font-semibold text-ink">
                                {item.label}
                            </span>
                        )}
                        {!last && (
                            <ChevronRight className="size-4 shrink-0 text-muted/60" />
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
