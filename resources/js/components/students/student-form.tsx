import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/StudentController';

export type StudentOptions = {
    classes: { id: number; name: string; departemen_id: number }[];
    departemens: { id: number; name: string }[];
    industries: { id: number; name: string }[];
    parents: { id: number; nama: string }[];
    periods: { id: number; name_period: string }[];
};

export type StudentDefaults = {
    name?: string;
    email?: string;
    nis?: string;
    placeOfBirth?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodType?: string;
    alamat?: string;
    image?: string | null;
    status_pkl?: string;
    pkl_start?: string | null;
    pkl_end?: string | null;
    class_id?: number;
    industri_id?: number;
    departemen_id?: number;
    parent_id?: number;
    p_k_l_period_id?: number | null;
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

export function StudentForm({
    action,
    method,
    options,
    student,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    options: StudentOptions;
    student?: StudentDefaults;
    submitLabel: string;
}) {
    const isCreate = !student;

    return (
        <Form action={action} method={method} className="space-y-8">
            {({ processing, errors }) => (
                <>
                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SectionTitle>Akun login</SectionTitle>
                            <Field
                                label="Nama lengkap"
                                htmlFor="name"
                                error={errors.name}
                            >
                                <input
                                    id="name"
                                    name="name"
                                    defaultValue={student?.name}
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
                                    defaultValue={student?.email}
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
                            <SectionTitle>Data diri</SectionTitle>
                            <Field label="NIS" htmlFor="nis" error={errors.nis}>
                                <input
                                    id="nis"
                                    name="nis"
                                    defaultValue={student?.nis}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Tempat lahir"
                                htmlFor="placeOfBirth"
                                error={errors.placeOfBirth}
                            >
                                <input
                                    id="placeOfBirth"
                                    name="placeOfBirth"
                                    defaultValue={student?.placeOfBirth}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Tanggal lahir"
                                htmlFor="dateOfBirth"
                                error={errors.dateOfBirth}
                            >
                                <input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    defaultValue={student?.dateOfBirth}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                            <Field
                                label="Jenis kelamin"
                                htmlFor="gender"
                                error={errors.gender}
                            >
                                <select
                                    id="gender"
                                    name="gender"
                                    defaultValue={student?.gender ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih…
                                    </option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                            </Field>
                            <Field
                                label="Golongan darah"
                                htmlFor="bloodType"
                                error={errors.bloodType}
                            >
                                <select
                                    id="bloodType"
                                    name="bloodType"
                                    defaultValue={student?.bloodType ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih…
                                    </option>
                                    {['A', 'B', 'AB', 'O'].map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Foto (opsional)"
                                htmlFor="image"
                                error={errors.image}
                            >
                                <input
                                    id="image"
                                    name="image"
                                    type="file"
                                    accept="image/*"
                                    className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
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
                                    defaultValue={student?.alamat}
                                    className={inputClass}
                                    required
                                />
                            </Field>
                        </div>
                    </section>

                    <section className="rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <SectionTitle>PKL &amp; penempatan</SectionTitle>
                            <Field
                                label="Status PKL"
                                htmlFor="status_pkl"
                                error={errors.status_pkl}
                            >
                                <select
                                    id="status_pkl"
                                    name="status_pkl"
                                    defaultValue={
                                        student?.status_pkl ?? 'belum'
                                    }
                                    className={inputClass}
                                    required
                                >
                                    <option value="belum">Belum mulai</option>
                                    <option value="proses">Berjalan</option>
                                    <option value="selesai">Selesai</option>
                                </select>
                            </Field>
                            <Field
                                label="Periode PKL"
                                htmlFor="p_k_l_period_id"
                                error={errors.p_k_l_period_id}
                            >
                                <select
                                    id="p_k_l_period_id"
                                    name="p_k_l_period_id"
                                    defaultValue={
                                        student?.p_k_l_period_id ?? ''
                                    }
                                    className={inputClass}
                                >
                                    <option value="">—</option>
                                    {options.periods.map((period) => (
                                        <option
                                            key={period.id}
                                            value={period.id}
                                        >
                                            {period.name_period}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Mulai PKL"
                                htmlFor="pkl_start"
                                error={errors.pkl_start}
                            >
                                <input
                                    id="pkl_start"
                                    name="pkl_start"
                                    type="date"
                                    defaultValue={student?.pkl_start ?? ''}
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label="Selesai PKL"
                                htmlFor="pkl_end"
                                error={errors.pkl_end}
                            >
                                <input
                                    id="pkl_end"
                                    name="pkl_end"
                                    type="date"
                                    defaultValue={student?.pkl_end ?? ''}
                                    className={inputClass}
                                />
                            </Field>
                            <Field
                                label="Jurusan"
                                htmlFor="departemen_id"
                                error={errors.departemen_id}
                            >
                                <select
                                    id="departemen_id"
                                    name="departemen_id"
                                    defaultValue={student?.departemen_id ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih jurusan…
                                    </option>
                                    {options.departemens.map((dept) => (
                                        <option key={dept.id} value={dept.id}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Kelas"
                                htmlFor="class_id"
                                error={errors.class_id}
                            >
                                <select
                                    id="class_id"
                                    name="class_id"
                                    defaultValue={student?.class_id ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih kelas…
                                    </option>
                                    {options.classes.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Industri"
                                htmlFor="industri_id"
                                error={errors.industri_id}
                            >
                                <select
                                    id="industri_id"
                                    name="industri_id"
                                    defaultValue={student?.industri_id ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih industri…
                                    </option>
                                    {options.industries.map((industry) => (
                                        <option
                                            key={industry.id}
                                            value={industry.id}
                                        >
                                            {industry.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field
                                label="Orang tua / wali"
                                htmlFor="parent_id"
                                error={errors.parent_id}
                            >
                                <select
                                    id="parent_id"
                                    name="parent_id"
                                    defaultValue={student?.parent_id ?? ''}
                                    className={inputClass}
                                    required
                                >
                                    <option value="" disabled>
                                        Pilih orang tua…
                                    </option>
                                    {options.parents.map((parent) => (
                                        <option
                                            key={parent.id}
                                            value={parent.id}
                                        >
                                            {parent.nama}
                                        </option>
                                    ))}
                                </select>
                            </Field>
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
