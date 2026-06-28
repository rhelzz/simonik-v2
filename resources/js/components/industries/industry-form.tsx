import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/IndustryController';

export type IndustryOptions = {
    teachers: { id: number; name: string }[];
    pembimbings: { id: number; name: string }[];
};

export type IndustryDefaults = {
    name?: string;
    email?: string;
    bidang?: string;
    alamat?: string;
    longitude?: string;
    latitude?: string;
    duration?: string | null;
    teacher_id?: number | null;
    pembimbing_id?: number | null;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function Field({
    label,
    htmlFor,
    error,
    children,
    full,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
    full?: boolean;
}) {
    return (
        <div className={full ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
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

function SectionTitle({ children }: { children: ReactNode }) {
    return (
        <h3 className="text-xs font-semibold tracking-[0.12em] text-muted uppercase sm:col-span-2">
            {children}
        </h3>
    );
}

export function IndustryForm({
    action,
    method,
    options,
    industry,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    options: IndustryOptions;
    industry?: IndustryDefaults;
    submitLabel: string;
}) {
    const isCreate = !industry;

    return (
        <Form action={action} method={method} className="space-y-8">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SectionTitle>Akun mitra</SectionTitle>
                            <Field
                                label="Nama industri"
                                htmlFor="name"
                                error={errors.name}
                            >
                                <input
                                    id="name"
                                    name="name"
                                    defaultValue={industry?.name}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Email"
                                htmlFor="email"
                                error={errors.email}
                            >
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    defaultValue={industry?.email}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            {isCreate && (
                                <>
                                    <Field
                                        label="Kata sandi"
                                        htmlFor="password"
                                        error={errors.password}
                                    >
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            className={inputClass}
                                            required
                                        />
                                    </Field>
                                    <Field
                                        label="Konfirmasi kata sandi"
                                        htmlFor="password_confirmation"
                                    >
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type="password"
                                            autoComplete="new-password"
                                            className={inputClass}
                                            required
                                        />
                                    </Field>
                                </>
                            )}
                        </div>
                    </section>

                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SectionTitle>Profil industri</SectionTitle>
                            <Field
                                label="Bidang"
                                htmlFor="bidang"
                                error={errors.bidang}
                            >
                                <input
                                    id="bidang"
                                    name="bidang"
                                    defaultValue={industry?.bidang}
                                    placeholder="mis. Software House"
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Durasi PKL (opsional)"
                                htmlFor="duration"
                                error={errors.duration}
                            >
                                <input
                                    id="duration"
                                    name="duration"
                                    defaultValue={industry?.duration ?? ''}
                                    placeholder="mis. 6 Bulan"
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label="Alamat"
                                htmlFor="alamat"
                                error={errors.alamat}
                                full
                            >
                                <textarea
                                    id="alamat"
                                    name="alamat"
                                    rows={2}
                                    defaultValue={industry?.alamat}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Latitude"
                                htmlFor="latitude"
                                error={errors.latitude}
                            >
                                <input
                                    id="latitude"
                                    name="latitude"
                                    defaultValue={industry?.latitude}
                                    placeholder="-6.914744"
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Longitude"
                                htmlFor="longitude"
                                error={errors.longitude}
                            >
                                <input
                                    id="longitude"
                                    name="longitude"
                                    defaultValue={industry?.longitude}
                                    placeholder="107.609810"
                                    className={inputClass}
                                    required
                                />
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SectionTitle>Penempatan pembimbing</SectionTitle>
                            <Field
                                label="Guru pembimbing (opsional)"
                                htmlFor="teacher_id"
                                error={errors.teacher_id}
                            >
                                <select
                                    id="teacher_id"
                                    name="teacher_id"
                                    defaultValue={industry?.teacher_id ?? ''}
                                    className={inputClass}
                                >
                                    <option value="">—</option>
                                    {options.teachers.map((teacher) => (
                                        <option
                                            key={teacher.id}
                                            value={teacher.id}
                                        >
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Pembimbing industri (opsional)"
                                htmlFor="pembimbing_id"
                                error={errors.pembimbing_id}
                            >
                                <select
                                    id="pembimbing_id"
                                    name="pembimbing_id"
                                    defaultValue={industry?.pembimbing_id ?? ''}
                                    className={inputClass}
                                >
                                    <option value="">—</option>
                                    {options.pembimbings.map((pembimbing) => (
                                        <option
                                            key={pembimbing.id}
                                            value={pembimbing.id}
                                        >
                                            {pembimbing.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <p className="text-xs text-muted sm:col-span-2">
                                Guru pembimbing & pembimbing industri yang
                                dipilih di sini otomatis menjadi pembimbing
                                semua siswa yang PKL di industri ini.
                            </p>
                        </div>
                    </section>

                    <div className="flex items-center justify-end gap-2">
                        <Link
                            href={index.url()}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-surface"
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
                </>
            )}
        </Form>
    );
}
