import { Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2, UserCog } from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/KaprogController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Kaprog = {
    id: number;
    name: string;
    email: string;
    departemens: string[];
    created_at: string | null;
};

type KaprogsIndexProps = {
    kaprogs: Paginated<Kaprog>;
    filters: { search: string };
};

export default function KaprogsIndex({ kaprogs, filters }: KaprogsIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function remove(kaprog: Kaprog) {
        if (
            confirm(
                `Hapus akun kepala program ${kaprog.name}? Akun login akan terhapus; program keahliannya akan dilepas (tidak ikut terhapus).`,
            )
        ) {
            router.delete(destroy.url(kaprog.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Data Kepala Program">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Kepala Program Keahlian
                        </h2>
                        <p className="text-sm text-muted">
                            {kaprogs.total} akun kaprog terdaftar
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah kaprog
                    </Link>
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
                            placeholder="Cari nama atau email…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {kaprogs.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <UserCog className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada akun kaprog
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Kepala program
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Program keahlian
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {kaprogs.data.map((kaprog) => (
                                    <tr key={kaprog.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {kaprog.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {kaprog.email}
                                            </p>
                                        </td>
                                        <td className="py-3">
                                            {kaprog.departemens.length === 0 ? (
                                                <span className="text-muted">
                                                    —
                                                </span>
                                            ) : (
                                                <div className="flex flex-wrap gap-1">
                                                    {kaprog.departemens.map(
                                                        (name) => (
                                                            <span
                                                                key={name}
                                                                className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"
                                                            >
                                                                {name}
                                                            </span>
                                                        ),
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={edit.url(kaprog.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${kaprog.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(kaprog)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${kaprog.name}`}
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

                <Pagination meta={kaprogs} />
            </section>
        </AppLayout>
    );
}
