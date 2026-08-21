import { Link, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Lock,
    LockOpen,
    Pencil,
    Pin,
    Send,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    destroyComment,
    index,
    storeComment,
    toggleClose,
    togglePin,
    update,
} from '@/actions/App/Http/Controllers/ForumController';
import { TagInput } from '@/components/forum/tag-input';
import type { Thread } from '@/components/forum/thread-card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ThreadDetail = Thread & { content: string };

type CommentRow = {
    id: number;
    content: string;
    author: string | null;
    createdAt: string | null;
    canDelete: boolean;
};

export default function ForumShow({
    thread,
    comments,
    can,
    suggestedTags,
}: {
    thread: ThreadDetail;
    comments: Paginated<CommentRow>;
    can: { edit: boolean; delete: boolean; moderate: boolean };
    suggestedTags: string[];
}) {
    const [editing, setEditing] = useState(false);

    const editForm = useForm({
        title: thread.title,
        content: thread.content,
        tags: thread.tags,
    });

    const replyForm = useForm({ content: '' });

    function saveThread(event: React.FormEvent) {
        event.preventDefault();
        editForm.patch(update.url(thread.id), {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    }

    function sendReply(event: React.FormEvent) {
        event.preventDefault();
        replyForm.post(storeComment.url(thread.id), {
            preserveScroll: true,
            onSuccess: () => replyForm.reset(),
        });
    }

    return (
        <AppLayout title={thread.title}>
            <Breadcrumb
                items={[
                    { label: 'Forum PKL', href: index.url() },
                    { label: thread.title },
                ]}
            />

            <section className="mt-4 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <Link
                        href={index.url()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali
                    </Link>

                    <div className="flex flex-wrap items-center gap-1.5">
                        {can.moderate && (
                            <>
                                <ModerationButton
                                    onClick={() =>
                                        router.patch(
                                            togglePin.url(thread.id),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    active={thread.pinned}
                                >
                                    <Pin className="size-3.5" />
                                    {thread.pinned
                                        ? 'Lepas sematan'
                                        : 'Sematkan'}
                                </ModerationButton>

                                <ModerationButton
                                    onClick={() =>
                                        router.patch(
                                            toggleClose.url(thread.id),
                                            {},
                                            { preserveScroll: true },
                                        )
                                    }
                                    active={thread.closed}
                                >
                                    {thread.closed ? (
                                        <LockOpen className="size-3.5" />
                                    ) : (
                                        <Lock className="size-3.5" />
                                    )}
                                    {thread.closed
                                        ? 'Buka diskusi'
                                        : 'Tutup diskusi'}
                                </ModerationButton>
                            </>
                        )}

                        {can.edit && !editing && (
                            <ModerationButton onClick={() => setEditing(true)}>
                                <Pencil className="size-3.5" />
                                Ubah
                            </ModerationButton>
                        )}

                        {can.delete && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (
                                        window.confirm(
                                            'Hapus diskusi ini beserta semua balasannya?',
                                        )
                                    ) {
                                        router.delete(destroy.url(thread.id));
                                    }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                            >
                                <Trash2 className="size-3.5" />
                                Hapus
                            </button>
                        )}
                    </div>
                </div>

                {editing ? (
                    <form onSubmit={saveThread} className="mt-4 space-y-4">
                        <input
                            type="text"
                            value={editForm.data.title}
                            onChange={(event) =>
                                editForm.setData('title', event.target.value)
                            }
                            className={inputClass}
                        />
                        {editForm.errors.title && (
                            <span className={errorClass}>
                                {editForm.errors.title}
                            </span>
                        )}

                        <textarea
                            value={editForm.data.content}
                            rows={6}
                            onChange={(event) =>
                                editForm.setData('content', event.target.value)
                            }
                            className={inputClass}
                        />

                        <TagInput
                            value={editForm.data.tags}
                            onChange={(tags) => editForm.setData('tags', tags)}
                            suggested={suggestedTags}
                            error={editForm.errors.tags}
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing(false)}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                            >
                                Simpan
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="mt-4">
                        <h1 className="text-lg font-bold text-ink">
                            {thread.title}
                        </h1>
                        <p className="text-xs text-muted">
                            {thread.author ?? 'Pengguna'}
                            {thread.createdAt ? ` · ${thread.createdAt}` : ''}
                        </p>

                        {thread.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                                {thread.tags.map((tag) => (
                                    <Link
                                        key={tag}
                                        href={index.url({ query: { tag } })}
                                        className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary hover:underline"
                                    >
                                        #{tag}
                                    </Link>
                                ))}
                            </div>
                        )}

                        {/* Teks biasa, BUKAN HTML — isi ditulis siswa (lihat
                            docs/v2.5 §2.8). whitespace-pre-wrap menjaga
                            baris baru tanpa membuka celah XSS. */}
                        <p className="mt-4 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                            {thread.content}
                        </p>
                    </div>
                )}
            </section>

            <section className="mt-5 rounded-3xl bg-surface p-5 sm:p-6">
                <h2 className="text-base font-bold text-ink">
                    Balasan ({comments.data.length > 0 ? thread.replies : 0})
                </h2>

                {comments.data.length === 0 ? (
                    <p className="mt-3 text-sm text-muted">
                        Belum ada balasan.
                    </p>
                ) : (
                    <div className="mt-3 divide-y divide-line">
                        {comments.data.map((comment) => (
                            <div
                                key={comment.id}
                                className="flex items-start justify-between gap-3 py-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-semibold text-ink">
                                        {comment.author ?? 'Pengguna'}
                                        <span className="ml-1 font-normal text-muted">
                                            {comment.createdAt}
                                        </span>
                                    </p>
                                    <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-ink">
                                        {comment.content}
                                    </p>
                                </div>

                                {comment.canDelete && (
                                    <button
                                        type="button"
                                        title="Hapus balasan"
                                        onClick={() => {
                                            if (
                                                window.confirm(
                                                    'Hapus balasan ini?',
                                                )
                                            ) {
                                                router.delete(
                                                    destroyComment.url(
                                                        comment.id,
                                                    ),
                                                    { preserveScroll: true },
                                                );
                                            }
                                        }}
                                        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                <Pagination meta={comments} />

                {thread.closed ? (
                    <p className="mt-4 flex items-center gap-2 rounded-2xl bg-canvas p-3 text-sm text-muted">
                        <Lock className="size-4 shrink-0" />
                        Diskusi ini sudah ditutup, balasan baru tidak diterima.
                    </p>
                ) : (
                    <form onSubmit={sendReply} className="mt-4">
                        <textarea
                            value={replyForm.data.content}
                            rows={3}
                            placeholder="Tulis balasan…"
                            onChange={(event) =>
                                replyForm.setData('content', event.target.value)
                            }
                            className={inputClass}
                        />
                        {replyForm.errors.content && (
                            <span className={errorClass}>
                                {replyForm.errors.content}
                            </span>
                        )}

                        <div className="mt-2 flex justify-end">
                            <button
                                type="submit"
                                disabled={replyForm.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                            >
                                <Send className="size-4" />
                                Kirim balasan
                            </button>
                        </div>
                    </form>
                )}
            </section>
        </AppLayout>
    );
}

function ModerationButton({
    onClick,
    active,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ' +
                (active
                    ? 'border-primary/40 bg-primary-soft text-primary'
                    : 'border-line text-muted hover:border-primary/40 hover:text-primary')
            }
        >
            {children}
        </button>
    );
}

const inputClass =
    'w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none';

const errorClass = 'mt-1 block text-xs font-medium text-red-500';
