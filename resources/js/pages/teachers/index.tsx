import { Link, router } from '@inertiajs/react';
import { Eye, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
    index,
    show,
} from '@/actions/App/Http/Controllers/TeacherController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Teacher = {
    id: number;
    name: string;
    no_hp: string;
    email: string | null;
    departemen: string | null;
    departemen_id: number;
    industries_count: number;
    students_count: number;
};

type TeachersIndexProps = {
    teachers: Paginated<Teacher>;
    filters: { search: string };
};

export default function TeachersIndex({
    teachers,
    filters,
}: TeachersIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function remove(teacher: Teacher) {
        if (
            confirm(
                `Hapus guru ${teacher.name}? Akun login beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(teacher.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Guru Pembimbing">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar guru pembimbing
                        </h2>
                        <p className="text-sm text-muted">
                            {teachers.total} guru terdaftar
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah guru
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
                            placeholder="Cari guru…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {teachers.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Users className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada guru
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">Guru</th>
                                    <th className="pb-3 font-semibold">
                                        Jurusan
                                    </th>
                                    <th className="pb-3 font-semibold">PT</th>
                                    <th className="pb-3 font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {teachers.data.map((teacher) => (
                                    <tr key={teacher.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {teacher.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {teacher.no_hp}
                                                {teacher.email
                                                    ? ` · ${teacher.email}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {teacher.departemen ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {teacher.industries_count}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {teacher.students_count}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={show.url(teacher.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Lihat detail ${teacher.name}`}
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
                                                <Link
                                                    href={edit.url(teacher.id)}
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${teacher.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(teacher)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${teacher.name}`}
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

                <Pagination meta={teachers} />
            </section>
        </AppLayout>
    );
}
