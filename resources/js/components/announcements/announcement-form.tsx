import { useForm } from '@inertiajs/react';
import { LoaderCircle, Megaphone } from 'lucide-react';
import type { FormEvent } from 'react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';

export type AnnouncementInput = {
    title: string;
    body: string;
    roles: string[];
    starts_at: string;
    ends_at: string;
};

const ALL = '*';

type Props = {
    /** Label target: { '*': 'All User', siswa: 'Murid', … } dari backend. */
    roleLabels: Record<string, string>;
    initial: AnnouncementInput;
    submitLabel: string;
    onSubmit: (form: ReturnType<typeof useForm<AnnouncementInput>>) => void;
};

export function AnnouncementForm({
    roleLabels,
    initial,
    submitLabel,
    onSubmit,
}: Props) {
    const form = useForm<AnnouncementInput>(initial);
    const allChecked = form.data.roles.includes(ALL);

    function toggleRole(role: string) {
        if (role === ALL) {
            form.setData('roles', allChecked ? [] : [ALL]);

            return;
        }

        form.setData(
            'roles',
            form.data.roles.includes(role)
                ? form.data.roles.filter((value) => value !== role)
                : [...form.data.roles.filter((value) => value !== ALL), role],
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        onSubmit(form);
    }

    return (
        <form onSubmit={submit} className="space-y-5">
            <label className="block">
                <span className={labelClass}>Judul</span>
                <input
                    type="text"
                    value={form.data.title}
                    onChange={(event) =>
                        form.setData('title', event.target.value)
                    }
                    maxLength={150}
                    className={inputClass}
                />
                <FieldError message={form.errors.title} />
            </label>

            <div>
                <span className={labelClass}>Isi pengumuman</span>
                <div className="mt-1 overflow-hidden rounded-xl border border-line bg-canvas">
                    <RichTextEditor
                        value={form.data.body}
                        onChange={(html) => form.setData('body', html)}
                    />
                </div>
                <FieldError message={form.errors.body} />
            </div>

            <div>
                <span className={labelClass}>Ditujukan kepada</span>
                <div className="mt-2 flex flex-wrap gap-2">
                    {Object.entries(roleLabels).map(([role, label]) => {
                        const checked =
                            role === ALL
                                ? allChecked
                                : allChecked || form.data.roles.includes(role);
                        const disabled = role !== ALL && allChecked;

                        return (
                            <label
                                key={role}
                                className={cn(
                                    'inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors',
                                    checked
                                        ? 'border-primary/40 bg-primary-soft text-primary'
                                        : 'border-line bg-canvas text-muted hover:text-ink',
                                    disabled && 'cursor-not-allowed opacity-60',
                                )}
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => toggleRole(role)}
                                    className="size-4 accent-[var(--color-primary)]"
                                />
                                {label}
                            </label>
                        );
                    })}
                </div>
                <p className="mt-1.5 text-xs text-muted">
                    Memilih <strong>All User</strong> mencakup semua role
                    sekaligus, termasuk yang ditambahkan di kemudian hari.
                </p>
                <FieldError message={form.errors.roles} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                    <span className={labelClass}>Mulai tayang</span>
                    <input
                        type="date"
                        value={form.data.starts_at}
                        onChange={(event) =>
                            form.setData('starts_at', event.target.value)
                        }
                        className={inputClass}
                    />
                    <FieldError message={form.errors.starts_at} />
                </label>
                <label className="block">
                    <span className={labelClass}>Berakhir</span>
                    <input
                        type="date"
                        value={form.data.ends_at}
                        onChange={(event) =>
                            form.setData('ends_at', event.target.value)
                        }
                        className={inputClass}
                    />
                    <FieldError message={form.errors.ends_at} />
                </label>
            </div>
            <p className="-mt-2 text-xs text-muted">
                Tanggal berakhir termasuk hari itu sendiri — pengumuman masih
                tampil pada tanggal tersebut.
            </p>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={form.processing}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                    {form.processing ? (
                        <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                        <Megaphone className="size-4" />
                    )}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}

const labelClass =
    'block text-xs font-semibold tracking-[0.12em] text-muted uppercase';

const inputClass =
    'mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none';

function FieldError({ message }: { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <span className="mt-1 block text-xs font-medium text-red-500">
            {message}
        </span>
    );
}
