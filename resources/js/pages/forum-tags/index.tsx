import { router } from '@inertiajs/react';
import { Check, Hash, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { destroy, update } from '@/actions/App/Http/Controllers/TagController';
import { normaliseTag } from '@/components/forum/tag-input';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type TagRow = {
    id: number;
    name: string;
    isSuggested: boolean;
    threads: number;
};

export default function ForumTagIndex({ tags }: { tags: Paginated<TagRow> }) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [draft, setDraft] = useState('');

    function save(tag: TagRow) {
        router.patch(
            update.url(tag.id),
            { name: draft, is_suggested: tag.isSuggested },
            { preserveScroll: true, onSuccess: () => setEditingId(null) },
        );
    }

    function toggleSuggested(tag: TagRow) {
        router.patch(
            update.url(tag.id),
            { name: tag.name, is_suggested: !tag.isSuggested },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout title="Kelola Tag Forum">
            <Breadcrumb items={[{ label: 'Kelola Tag Forum' }]} />

            <section className="mt-4 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Hash className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Kelola Tag Forum
                        </h2>
                        <p className="text-sm text-muted">
                            Tag tetap bebas dibuat pengguna. Di sini Anda
                            merapikan namanya dan menentukan mana yang tampil
                            sebagai saran.
                        </p>
                    </div>
                </div>

                {tags.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Hash className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada tag
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[38rem] text-sm">
                            <thead>
                                <tr className="border-b border-line text-left text-xs font-semibold tracking-[0.08em] text-muted uppercase">
                                    <th className="px-3 py-2.5">Tag</th>
                                    <th className="px-3 py-2.5">Diskusi</th>
                                    <th className="px-3 py-2.5">Saran</th>
                                    <th className="px-3 py-2.5 text-right">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {tags.data.map((tag) => (
                                    <tr key={tag.id}>
                                        <td className="px-3 py-2.5">
                                            {editingId === tag.id ? (
                                                <input
                                                    type="text"
                                                    value={draft}
                                                    autoFocus
                                                    onChange={(event) =>
                                                        setDraft(
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="w-full rounded-lg border border-line bg-canvas px-2 py-1 text-sm text-ink focus:border-primary focus:outline-none"
                                                />
                                            ) : (
                                                <span className="font-semibold text-primary">
                                                    #{tag.name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-muted">
                                            {tag.threads}
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    toggleSuggested(tag)
                                                }
                                                className={
                                                    'rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ' +
                                                    (tag.isSuggested
                                                        ? 'bg-positive/15 text-positive'
                                                        : 'bg-canvas text-muted hover:text-ink')
                                                }
                                            >
                                                {tag.isSuggested
                                                    ? 'Ya'
                                                    : 'Tidak'}
                                            </button>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex justify-end gap-1">
                                                {editingId === tag.id ? (
                                                    <>
                                                        <IconButton
                                                            title="Simpan"
                                                            onClick={() =>
                                                                save(tag)
                                                            }
                                                            disabled={
                                                                normaliseTag(
                                                                    draft,
                                                                ) === ''
                                                            }
                                                        >
                                                            <Check className="size-4" />
                                                        </IconButton>
                                                        <IconButton
                                                            title="Batal"
                                                            onClick={() =>
                                                                setEditingId(
                                                                    null,
                                                                )
                                                            }
                                                        >
                                                            <X className="size-4" />
                                                        </IconButton>
                                                    </>
                                                ) : (
                                                    <IconButton
                                                        title="Ubah nama"
                                                        onClick={() => {
                                                            setEditingId(
                                                                tag.id,
                                                            );
                                                            setDraft(tag.name);
                                                        }}
                                                    >
                                                        <Pencil className="size-4" />
                                                    </IconButton>
                                                )}

                                                <button
                                                    type="button"
                                                    title="Hapus tag"
                                                    onClick={() => {
                                                        if (
                                                            window.confirm(
                                                                `Hapus tag #${tag.name}? Diskusinya tetap ada, hanya labelnya yang hilang.`,
                                                            )
                                                        ) {
                                                            router.delete(
                                                                destroy.url(
                                                                    tag.id,
                                                                ),
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                        }
                                                    }}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-500/10 hover:text-red-500"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination meta={tags} />
            </section>
        </AppLayout>
    );
}

function IconButton({
    title,
    onClick,
    disabled,
    children,
}: {
    title: string;
    onClick: () => void;
    disabled?: boolean;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40"
        >
            {children}
        </button>
    );
}
