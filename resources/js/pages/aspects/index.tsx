import { router, useForm } from '@inertiajs/react';
import {
    ClipboardList,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/AspectController';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type Category = 'teknis' | 'non_teknis';

type AspectRow = {
    id: number;
    category: Category;
    no: number;
    kemampuan: string;
    evaluations_count: number;
};

type AspectsIndexProps = {
    aspects: Paginated<AspectRow>;
    filters: { search: string };
};

const categoryLabels: Record<Category, string> = {
    teknis: 'Teknis',
    non_teknis: 'Non-Teknis',
};

const categoryStyles: Record<Category, string> = {
    teknis: 'bg-primary/10 text-primary',
    non_teknis: 'bg-warning/15 text-warning',
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

const emptyForm = {
    category: 'teknis' as Category,
    no: '',
    kemampuan: '',
};

export default function AspectsIndex({ aspects, filters }: AspectsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<AspectRow | null>(null);

    const form = useForm({ ...emptyForm });

    function close() {
        setOpen(false);
        form.reset();
        form.clearErrors();
    }

    function openCreate() {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(aspect: AspectRow) {
        form.setData({
            category: aspect.category,
            no: String(aspect.no),
            kemampuan: aspect.kemampuan,
        });
        form.clearErrors();
        setEditing(aspect);
        setOpen(true);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: close };

        if (editing) {
            form.put(update.url(editing.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    function remove(aspect: AspectRow) {
        if (
            confirm(
                `Hapus aspek "${aspect.kemampuan}"? Nilai siswa pada aspek ini ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(aspect.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Aspek Penilaian">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Master aspek penilaian
                        </h2>
                        <p className="text-sm text-muted">
                            {aspects.total} aspek · teknis diisi pembimbing,
                            non-teknis diisi guru
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah aspek
                    </button>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            index.url(),
                            { search },
                            {
                                preserveState: true,
                                replace: true,
                                preserveScroll: true,
                            },
                        );
                    }}
                    className="mt-5"
                >
                    <label className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted">
                        <Search className="size-4" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari kemampuan…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {aspects.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <ClipboardList className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada aspek penilaian
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">No</th>
                                    <th className="pb-3 font-semibold">
                                        Kemampuan
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Kategori
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Dinilai
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {aspects.data.map((aspect) => (
                                    <tr key={aspect.id}>
                                        <td className="py-3 text-ink/80">
                                            {aspect.no}
                                        </td>
                                        <td className="py-3 font-medium text-ink">
                                            {aspect.kemampuan}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    categoryStyles[
                                                        aspect.category
                                                    ],
                                                )}
                                            >
                                                {
                                                    categoryLabels[
                                                        aspect.category
                                                    ]
                                                }
                                            </span>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {aspect.evaluations_count} siswa
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(aspect)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${aspect.kemampuan}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(aspect)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${aspect.kemampuan}`}
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

                <Pagination meta={aspects} />
            </section>

            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Edit aspek' : 'Tambah aspek'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field
                        label="Kategori"
                        htmlFor="category"
                        error={form.errors.category}
                    >
                        <select
                            id="category"
                            value={form.data.category}
                            onChange={(event) =>
                                form.setData(
                                    'category',
                                    event.target.value as Category,
                                )
                            }
                            className={inputClass}
                        >
                            <option value="teknis">Teknis</option>
                            <option value="non_teknis">Non-Teknis</option>
                        </select>
                    </Field>
                    <Field
                        label="Nomor urut"
                        htmlFor="no"
                        error={form.errors.no}
                    >
                        <input
                            id="no"
                            type="number"
                            min={1}
                            value={form.data.no}
                            onChange={(event) =>
                                form.setData('no', event.target.value)
                            }
                            placeholder="mis. 1"
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Kemampuan"
                        htmlFor="kemampuan"
                        error={form.errors.kemampuan}
                    >
                        <input
                            id="kemampuan"
                            value={form.data.kemampuan}
                            onChange={(event) =>
                                form.setData('kemampuan', event.target.value)
                            }
                            placeholder="mis. Disiplin & ketepatan waktu"
                            className={inputClass}
                            autoFocus
                        />
                    </Field>

                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={close}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            {form.processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </AppLayout>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
}
