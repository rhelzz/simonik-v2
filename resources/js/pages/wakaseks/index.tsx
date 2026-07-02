import { Link, router } from '@inertiajs/react';
import { Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
} from '@/actions/App/Http/Controllers/WakasekController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Wakasek = {
    id: number;
    name: string;
    email: string;
    created_at: string | null;
};

type WakaseksIndexProps = {
    wakaseks: Paginated<Wakasek>;
    filters: { search: string };
};

export default function WakaseksIndex({
    wakaseks,
    filters,
}: WakaseksIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function remove(wakasek: Wakasek) {
        if (
            confirm(
                `Hapus akun wakasek ${wakasek.name}? Akun login beserta aksesnya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(wakasek.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Data Wakasek">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Wakasek Humas / Hubin
                        </h2>
                        <p className="text-sm text-muted">
                            {wakaseks.total} akun wakasek terdaftar
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah wakasek
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

                {wakaseks.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <ShieldCheck className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada akun wakasek
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Wakasek
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Terdaftar
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {wakaseks.data.map((wakasek) => (
                                    <tr key={wakasek.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {wakasek.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {wakasek.email}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {wakasek.created_at ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={edit.url(wakasek.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${wakasek.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(wakasek)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${wakasek.name}`}
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

                <Pagination meta={wakaseks} />
            </section>
        </AppLayout>
    );
}
