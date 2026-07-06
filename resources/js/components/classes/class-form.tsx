import { Form, Link } from '@inertiajs/react';
import { AlertCircle, FolderTree, LoaderCircle, School } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/ClassController';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';

export type DepartemenOption = { id: number; name: string };

export type ClassDefaults = {
    id: number;
    name: string;
    departemen_id: number;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export function ClassForm({
    action,
    method,
    departemens,
    classItem,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    departemens: DepartemenOption[];
    classItem?: ClassDefaults;
    submitLabel: string;
}) {
    const [departemenId, setDepartemenId] = useState(
        classItem?.departemen_id != null ? String(classItem.departemen_id) : '',
    );

    const departemenOptions: SelectOption[] = departemens.map((departemen) => ({
        value: String(departemen.id),
        label: departemen.name,
    }));

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                                <School className="size-5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-ink">
                                    Data kelas
                                </h3>
                                <p className="text-xs text-muted">
                                    Nama rombongan belajar dan jurusannya.
                                </p>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <Field
                                label="Nama kelas"
                                htmlFor="name"
                                error={errors.name}
                                required
                            >
                                <input
                                    id="name"
                                    name="name"
                                    defaultValue={classItem?.name}
                                    placeholder="mis. XII RPL A"
                                    className={inputClass}
                                    autoFocus
                                    required
                                />
                            </Field>
                            <Field
                                label="Jurusan"
                                error={errors.departemen_id}
                                required
                            >
                                <Select
                                    name="departemen_id"
                                    ariaLabel="Jurusan"
                                    value={departemenId}
                                    options={departemenOptions}
                                    onChange={setDepartemenId}
                                    placeholder="Pilih jurusan…"
                                    icon={<FolderTree className="size-4" />}
                                />
                            </Field>
                        </div>
                    </section>

                    <div className="sticky bottom-4 flex items-center justify-end gap-2 rounded-2xl border border-line bg-surface/80 p-3 backdrop-blur">
                        <Link
                            href={index.url()}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            {processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            {submitLabel}
                        </button>
                    </div>
                    <div className="h-20" />
                </>
            )}
        </Form>
    );
}

function Field({
    label,
    htmlFor,
    error,
    required,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
                {required && <span className="ml-0.5 text-red-500">*</span>}
            </label>
            {children}
            {error && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="size-3.5" />
                    {error}
                </p>
            )}
        </div>
    );
}
