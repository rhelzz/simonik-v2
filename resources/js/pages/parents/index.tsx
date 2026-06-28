import { router, useForm } from '@inertiajs/react';
import {
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/ParentController';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type ParentRow = {
    id: number;
    nama: string;
    gender: string | null;
    occupation: string;
    phoneNumber: string;
    email: string | null;
    students_count: number;
};

type ParentsIndexProps = {
    parents: Paginated<ParentRow>;
    filters: { search: string };
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

const emptyForm = {
    nama: '',
    email: '',
    password: '',
    password_confirmation: '',
    gender: '',
    alamat: '',
    occupation: '',
    phoneNumber: '',
};

export default function ParentsIndex({ parents, filters }: ParentsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ParentRow | null>(null);

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

    function openEdit(parent: ParentRow) {
        form.setData({
            ...emptyForm,
            nama: parent.nama,
            email: parent.email ?? '',
            gender: parent.gender ?? '',
            occupation: parent.occupation,
            phoneNumber: parent.phoneNumber,
        });
        form.clearErrors();
        setEditing(parent);
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

    function remove(parent: ParentRow) {
        if (
            confirm(
                `Hapus orang tua ${parent.nama}? Akun login beserta datanya akan ikut terhapus.`,
            )
        ) {
            router.delete(destroy.url(parent.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Data Orang Tua">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Daftar orang tua / wali
                        </h2>
                        <p className="text-sm text-muted">
                            {parents.total} orang tua terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah orang tua
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
                            placeholder="Cari orang tua…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {parents.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <UsersRound className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada orang tua
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Orang tua
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Pekerjaan
                                    </th>
                                    <th className="pb-3 font-semibold">Anak</th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {parents.data.map((parent) => (
                                    <tr key={parent.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {parent.nama}
                                            </p>
                                            <p className="text-xs text-muted">
                                                {parent.phoneNumber}
                                                {parent.email
                                                    ? ` · ${parent.email}`
                                                    : ''}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {parent.occupation}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {parent.students_count}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(parent)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${parent.nama}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(parent)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${parent.nama}`}
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

                <Pagination meta={parents} />
            </section>

            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Edit orang tua' : 'Tambah orang tua'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field
                        label="Nama lengkap"
                        htmlFor="nama"
                        error={form.errors.nama}
                    >
                        <input
                            id="nama"
                            value={form.data.nama}
                            onChange={(event) =>
                                form.setData('nama', event.target.value)
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
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Jenis kelamin"
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
                                <option value="" disabled>
                                    Pilih…
                                </option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                        </Field>
                        <Field
                            label="Pekerjaan"
                            htmlFor="occupation"
                            error={form.errors.occupation}
                        >
                            <input
                                id="occupation"
                                value={form.data.occupation}
                                onChange={(event) =>
                                    form.setData(
                                        'occupation',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                        </Field>
                    </div>
                    <Field
                        label="No. HP"
                        htmlFor="phoneNumber"
                        error={form.errors.phoneNumber}
                    >
                        <input
                            id="phoneNumber"
                            value={form.data.phoneNumber}
                            onChange={(event) =>
                                form.setData('phoneNumber', event.target.value)
                            }
                            placeholder="08xxxxxxxxxx"
                            className={inputClass}
                        />
                    </Field>
                    <Field
                        label="Alamat"
                        htmlFor="alamat"
                        error={form.errors.alamat}
                    >
                        <textarea
                            id="alamat"
                            rows={2}
                            value={form.data.alamat}
                            onChange={(event) =>
                                form.setData('alamat', event.target.value)
                            }
                            className={inputClass}
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
