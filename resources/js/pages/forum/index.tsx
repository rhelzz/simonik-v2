import { router, useForm } from '@inertiajs/react';
import { MessagesSquare, Plus, Send } from 'lucide-react';
import { useState } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/ForumController';
import { TagInput } from '@/components/forum/tag-input';
import { TagStrip } from '@/components/forum/tag-strip';
import { ThreadCard } from '@/components/forum/thread-card';
import type { Thread } from '@/components/forum/thread-card';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

export default function ForumIndex({
    threads,
    filters,
    suggestedTags,
}: {
    threads: Paginated<Thread>;
    filters: { cari: string; tag: string };
    suggestedTags: string[];
}) {
    const [search, setSearch] = useState(filters.cari);
    const [creating, setCreating] = useState(false);

    const form = useForm<{ title: string; content: string; tags: string[] }>({
        title: '',
        content: '',
        tags: [],
    });

    function applySearch(value: string) {
        setSearch(value);
        router.get(
            index.url(),
            { cari: value, tag: filters.tag || undefined },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post(store.url(), {
            onSuccess: () => {
                form.reset();
                setCreating(false);
            },
        });
    }

    return (
        <AppLayout title="Forum PKL">
            <Breadcrumb items={[{ label: 'Forum PKL' }]} />

            <section className="mt-4 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                            <MessagesSquare className="size-5" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-ink">
                                Forum PKL
                            </h2>
                            <p className="text-sm text-muted">
                                Tempat bertanya dan berbagi info seputar PKL.
                                Gunakan tag agar mudah ditemukan.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setCreating(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Buat diskusi
                    </button>
                </div>

                <input
                    type="search"
                    value={search}
                    onChange={(event) => applySearch(event.target.value)}
                    placeholder="Cari judul diskusi…"
                    className="mt-4 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none sm:max-w-xs"
                />

                <TagStrip
                    tags={suggestedTags}
                    active={filters.tag}
                    search={filters.cari}
                />

                {threads.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <MessagesSquare className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            {filters.tag || filters.cari
                                ? 'Tidak ada diskusi yang cocok'
                                : 'Belum ada diskusi. Mulai yang pertama!'}
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-2">
                        {threads.data.map((thread) => (
                            <ThreadCard key={thread.id} thread={thread} />
                        ))}
                    </div>
                )}

                <Pagination meta={threads} />
            </section>

            <Modal
                open={creating}
                onClose={() => setCreating(false)}
                title="Buat diskusi"
            >
                <form onSubmit={submit} className="space-y-4">
                    <label className="block">
                        <span className={labelClass}>Judul</span>
                        <input
                            type="text"
                            value={form.data.title}
                            onChange={(event) =>
                                form.setData('title', event.target.value)
                            }
                            maxLength={150}
                            className={inputClass}
                        />
                        {form.errors.title && (
                            <span className={errorClass}>
                                {form.errors.title}
                            </span>
                        )}
                    </label>

                    <label className="block">
                        <span className={labelClass}>Isi</span>
                        <textarea
                            value={form.data.content}
                            rows={6}
                            onChange={(event) =>
                                form.setData('content', event.target.value)
                            }
                            className={inputClass}
                        />
                        {form.errors.content && (
                            <span className={errorClass}>
                                {form.errors.content}
                            </span>
                        )}
                    </label>

                    <div>
                        <span className={labelClass}>Tag</span>
                        <div className="mt-1">
                            <TagInput
                                value={form.data.tags}
                                onChange={(tags) => form.setData('tags', tags)}
                                suggested={suggestedTags}
                                error={form.errors.tags}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setCreating(false)}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            <Send className="size-4" />
                            Kirim
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}

const labelClass =
    'block text-xs font-semibold tracking-[0.12em] text-muted uppercase';

const inputClass =
    'mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none';

const errorClass = 'mt-1 block text-xs font-medium text-red-500';
