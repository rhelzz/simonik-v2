import { Link, router, useForm } from '@inertiajs/react';
import {
    Eye,
    FolderTree,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    destroy,
    index,
    show,
    store,
    update,
} from '@/actions/App/Http/Controllers/DepartemenController';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Departemen = {
    id: number;
    name: string;
    slug: string;
    classes_count: number;
    students_count: number;
};

type DepartemensIndexProps = {
    departemens: Paginated<Departemen>;
    filters: { search: string };
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export default function DepartemensIndex({
    departemens,
    filters,
}: DepartemensIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Departemen | null>(null);

    const form = useForm({ name: '' });

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

    function openEdit(departemen: Departemen) {
        form.setData('name', departemen.name);
        form.clearErrors();
        setEditing(departemen);
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

    function remove(departemen: Departemen) {
        if (confirm(`Hapus jurusan ${departemen.name}?`)) {
            router.delete(destroy.url(departemen.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Jurusan">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar jurusan
                        </h2>
                        <p className="text-sm text-muted">
                            {departemens.total} jurusan terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah jurusan
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
                            placeholder="Cari jurusan…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {departemens.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <FolderTree className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada jurusan
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">Nama</th>
                                    <th className="pb-3 font-semibold">
                                        Kelas
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
                                {departemens.data.map((departemen) => (
                                    <tr key={departemen.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {departemen.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {departemen.slug}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {departemen.classes_count}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {departemen.students_count}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={show.url(departemen.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Lihat ${departemen.name}`}
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(departemen)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${departemen.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(departemen)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${departemen.name}`}
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

                <Pagination meta={departemens} />
            </section>

            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Edit jurusan' : 'Tambah jurusan'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium text-ink"
                        >
                            Nama jurusan
                        </label>
                        <input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="mis. Rekayasa Perangkat Lunak"
                            className={inputClass}
                            autoFocus
                        />
                        {form.errors.name && (
                            <p className="text-xs font-medium text-red-500">
                                {form.errors.name}
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
