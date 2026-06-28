import { router, useForm } from '@inertiajs/react';
import {
    LoaderCircle,
    Pencil,
    Plus,
    School,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ClassController';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ClassRow = {
    id: number;
    name: string;
    slug: string;
    departemen: string | null;
    departemen_id: number;
    students_count: number;
};

type DepartemenOption = { id: number; name: string };

type ClassesIndexProps = {
    classes: Paginated<ClassRow>;
    departemens: DepartemenOption[];
    filters: { search: string };
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export default function ClassesIndex({
    classes,
    departemens,
    filters,
}: ClassesIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ClassRow | null>(null);

    const form = useForm({ name: '', departemen_id: '' });

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

    function openEdit(row: ClassRow) {
        form.setData({
            name: row.name,
            departemen_id: String(row.departemen_id),
        });
        form.clearErrors();
        setEditing(row);
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

    function remove(row: ClassRow) {
        if (confirm(`Hapus kelas ${row.name}?`)) {
            router.delete(destroy.url(row.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Kelas">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar kelas
                        </h2>
                        <p className="text-sm text-muted">
                            {classes.total} kelas terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah kelas
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
                            placeholder="Cari kelas…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {classes.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <School className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada kelas
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">Nama</th>
                                    <th className="pb-3 font-semibold">
                                        Jurusan
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {classes.data.map((row) => (
                                    <tr key={row.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {row.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {row.slug}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {row.departemen ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {row.students_count}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(row)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${row.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => remove(row)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${row.name}`}
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

                <Pagination meta={classes} />
            </section>

            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Edit kelas' : 'Tambah kelas'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium text-ink"
                        >
                            Nama kelas
                        </label>
                        <input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="mis. XII RPL A"
                            className={inputClass}
                            autoFocus
                        />
                        {form.errors.name && (
                            <p className="text-xs font-medium text-red-500">
                                {form.errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="departemen_id"
                            className="text-sm font-medium text-ink"
                        >
                            Jurusan
                        </label>
                        <select
                            id="departemen_id"
                            value={form.data.departemen_id}
                            onChange={(event) =>
                                form.setData(
                                    'departemen_id',
                                    event.target.value,
                                )
                            }
                            className={inputClass}
                        >
                            <option value="" disabled>
                                Pilih jurusan…
                            </option>
                            {departemens.map((departemen) => (
                                <option
                                    key={departemen.id}
                                    value={departemen.id}
                                >
                                    {departemen.name}
                                </option>
                            ))}
                        </select>
                        {form.errors.departemen_id && (
                            <p className="text-xs font-medium text-red-500">
                                {form.errors.departemen_id}
                            </p>
                        )}
                    </div>

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
