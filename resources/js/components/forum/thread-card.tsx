import { Link } from '@inertiajs/react';
import { Lock, MessageSquare, Pin } from 'lucide-react';
import { show } from '@/actions/App/Http/Controllers/ForumController';

export type Thread = {
    id: number;
    title: string;
    author: string | null;
    tags: string[];
    replies: number;
    pinned: boolean;
    closed: boolean;
    createdAt: string | null;
};

export function ThreadCard({ thread }: { thread: Thread }) {
    return (
        <Link
            href={show.url(thread.id)}
            prefetch
            className="block rounded-2xl border border-line bg-canvas/40 p-4 transition-colors hover:border-primary/40 hover:bg-canvas"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {thread.pinned && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                                <Pin className="size-3" />
                                Disematkan
                            </span>
                        )}
                        {thread.closed && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-canvas px-2 py-0.5 text-xs font-semibold text-muted">
                                <Lock className="size-3" />
                                Ditutup
                            </span>
                        )}
                    </div>

                    <p className="mt-1 font-semibold text-ink">
                        {thread.title}
                    </p>

                    <p className="text-xs text-muted">
                        {thread.author ?? 'Pengguna'}
                        {thread.createdAt ? ` · ${thread.createdAt}` : ''}
                    </p>

                    {thread.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {thread.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted">
                    <MessageSquare className="size-3.5" />
                    {thread.replies}
                </span>
            </div>
        </Link>
    );
}
