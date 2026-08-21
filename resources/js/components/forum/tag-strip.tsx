import { Link } from '@inertiajs/react';
import { index } from '@/actions/App/Http/Controllers/ForumController';
import { cn } from '@/lib/utils';

/**
 * Deretan tag untuk menyaring daftar diskusi.
 *
 * Penyaringan terjadi di server (scopeWithTag) supaya daftarnya tetap
 * terpaginasi — itulah alasan tag disimpan ternormalisasi, bukan JSON.
 */
export function TagStrip({
    tags,
    active,
    search,
}: {
    tags: string[];
    active: string;
    search: string;
}) {
    if (tags.length === 0) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-wrap gap-1.5">
            <Link
                href={index.url({ query: { cari: search || undefined } })}
                preserveScroll
                className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    active === ''
                        ? 'border-primary/40 bg-primary-soft text-primary'
                        : 'border-line text-muted hover:text-ink',
                )}
            >
                Semua
            </Link>

            {tags.map((tag) => (
                <Link
                    key={tag}
                    href={index.url({
                        query: { tag, cari: search || undefined },
                    })}
                    preserveScroll
                    className={cn(
                        'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                        active === tag
                            ? 'border-primary/40 bg-primary-soft text-primary'
                            : 'border-line text-muted hover:text-ink',
                    )}
                >
                    #{tag}
                </Link>
            ))}
        </div>
    );
}
