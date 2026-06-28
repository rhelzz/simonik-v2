import { router, useForm } from '@inertiajs/react';
import {
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/PembimbingController';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type Pembimbing = {
    id: number;
    name: string;
    no_hp: string;
    gender: string | null;
    email: string | null;
    industry: string | null;
    students_count: number;
};

type PembimbingsIndexProps = {
    pembimbings: Paginated<Pembimbing>;
    filters: { search: string };
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

const genderLabels: Record<string, string> = {
    L: 'Laki-laki',
    P: 'Perempuan',
};

const emptyForm = {
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    no_hp: '',
    gender: '',
};

export default function PembimbingsIndex({
    pembimbings,
    filters,
}: PembimbingsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Pembimbing | null>(null);

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

    function openEdit(pembimbing: Pembimbing) {
        form.setData({
            ...emptyForm,
            name: pembimbing.name,
            email: pembimbing.email ?? '',
            no_hp: pembimbing.no_hp,
            gender: pembimbing.gender ?? '',
        });
        form.clearErrors();
        setEditing(pembimbing);
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

    function remove(pembimbing: Pembimbing) {
        if (
            confirm(
                `Hapus pembimbing ${pembimbing.name}? Akun login beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(pembimbing.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Pembimbing">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar pembimbing
                        </h2>
                        <p className="text-sm text-muted">
                            {pembimbings.total} pembimbing terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah pembimbing
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
                            placeholder="Cari pembimbing…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {pembimbings.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <UserCheck className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada pembimbing
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Pembimbing
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Gender
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Industri (PT)
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
                                {pembimbings.data.map((pembimbing) => (
                                    <tr key={pembimbing.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {pembimbing.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {pembimbing.no_hp}
                                                {pembimbing.email
                                                    ? ` · ${pembimbing.email}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {pembimbing.gender
                                                ? genderLabels[
                                                      pembimbing.gender
                                                  ]
                                                : '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {pembimbing.industry ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {pembimbing.students_count}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(pembimbing)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${pembimbing.name}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(pembimbing)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${pembimbing.name}`}
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

                <Pagination meta={pembimbings} />
            </section>

            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Edit pembimbing' : 'Tambah pembimbing'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field
                        label="Nama lengkap"
                        htmlFor="name"
                        error={form.errors.name}
                    >
                        <input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            className={inputClass}
                            autoFocus
                        />
                    </Field>
                    <Field
                        label="Email"
                        htmlFor="email"
                        error={form.errors.email}
                    >
                        <input
                            id="email"
                            type="email"
                            value={form.data.email}
                            onChange={(event) =>
                                form.setData('email', event.target.value)
                            }
                            className={inputClass}
                        />
                    </Field>
                    {!editing && (
                        <>
                            <Field
                                label="Kata sandi"
                                htmlFor="password"
                                error={form.errors.password}
                            >
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.data.password}
                                    onChange={(event) =>
                                        form.setData(
                                            'password',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label="Konfirmasi kata sandi"
                                htmlFor="password_confirmation"
                            >
                                <input
                                    id="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.data.password_confirmation}
                                    onChange={(event) =>
                                        form.setData(
                                            'password_confirmation',
                                            event.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        </>
                    )}
                    <Field
                        label="No. HP"
                        htmlFor="no_hp"
                        error={form.errors.no_hp}
                    >
                        <input
                            id="no_hp"
                            value={form.data.no_hp}
                            onChange={(event) =>
                                form.setData('no_hp', event.target.value)
                            }
                            placeholder="08xxxxxxxxxx"
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Jenis kelamin (opsional)"
                        htmlFor="gender"
                        error={form.errors.gender}
                    >
                        <select
                            id="gender"
                            value={form.data.gender}
                            onChange={(event) =>
                                form.setData('gender', event.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">—</option>
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                        </select>
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
