import { router, useForm } from '@inertiajs/react';
import {
    CalendarRange,
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
} from '@/actions/App/Http/Controllers/PeriodController';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import type { Paginated } from '@/types';

type PeriodRow = {
    id: number;
    name_period: string;
    start_period: string | null;
    end_period: string | null;
    students_count: number;
};

type PeriodsIndexProps = {
    periods: Paginated<PeriodRow>;
    filters: { search: string };
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

const emptyForm = {
    name_period: '',
    start_period: '',
    end_period: '',
};

export default function PeriodsIndex({ periods, filters }: PeriodsIndexProps) {
    const [search, setSearch] = useState(filters.search);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<PeriodRow | null>(null);

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

    function openEdit(period: PeriodRow) {
        form.setData({
            name_period: period.name_period,
            start_period: period.start_period ?? '',
            end_period: period.end_period ?? '',
        });
        form.clearErrors();
        setEditing(period);
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

    function remove(period: PeriodRow) {
        if (confirm(`Hapus periode ${period.name_period}?`)) {
            router.delete(destroy.url(period.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Periode PKL">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Gelombang / periode PKL
                        </h2>
                        <p className="text-sm text-muted">
                            {periods.total} periode terdaftar
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={openCreate}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah periode
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
                            placeholder="Cari periode…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {periods.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <CalendarRange className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada periode
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-lg border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Periode
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Mulai
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Selesai
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
                                {periods.data.map((period) => (
                                    <tr key={period.id}>
                                        <td className="py-3 font-semibold text-ink">
                                            {period.name_period}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {period.start_period ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {period.end_period ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {period.students_count}
                                        </td>
                                        <td className="py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(period)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label={`Edit ${period.name_period}`}
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        remove(period)
                                                    }
                                                    className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                    aria-label={`Hapus ${period.name_period}`}
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

                <Pagination meta={periods} />
            </section>

            <Modal
                open={open}
                onClose={close}
                title={editing ? 'Edit periode' : 'Tambah periode'}
            >
                <form onSubmit={submit} className="space-y-4">
                    <Field
                        label="Nama periode"
                        htmlFor="name_period"
                        error={form.errors.name_period}
                    >
                        <input
                            id="name_period"
                            value={form.data.name_period}
                            onChange={(event) =>
                                form.setData('name_period', event.target.value)
                            }
                            placeholder="mis. Gelombang 1 - 2026"
                            className={inputClass}
                            autoFocus
                        />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Tanggal mulai"
                            htmlFor="start_period"
                            error={form.errors.start_period}
                        >
                            <input
                                id="start_period"
                                type="date"
                                value={form.data.start_period}
                                onChange={(event) =>
                                    form.setData(
                                        'start_period',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="Tanggal selesai"
                            htmlFor="end_period"
                            error={form.errors.end_period}
                        >
                            <input
                                id="end_period"
                                type="date"
                                value={form.data.end_period}
                                onChange={(event) =>
                                    form.setData(
                                        'end_period',
                                        event.target.value,
                                    )
                                }
                                className={inputClass}
                            />
                        </Field>
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
