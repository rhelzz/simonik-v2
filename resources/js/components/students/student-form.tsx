import { Form, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Briefcase,
    Check,
    Eye,
    EyeOff,
    IdCard,
    LoaderCircle,
    UserCircle2,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/StudentController';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';

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
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function Field({
    label,
    htmlFor,
    error,
    children,
    full,
    hint,
    required,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
    full?: boolean;
    hint?: string;
    required?: boolean;
}) {
    return (
        <div className={full ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
            <label
                htmlFor={htmlFor}
                className="flex items-center gap-1 text-sm font-medium text-ink"
            >
                {label}
                {required && <span className="text-red-500">*</span>}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted">{hint}</p>}
            {error && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="size-3.5 shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
}

/** Card section with an icon badge, title and short description. */
function Section({
    icon,
    title,
    description,
    children,
}: {
    icon: ReactNode;
    title: string;
    description: string;
    children: ReactNode;
}) {
    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold text-ink">{title}</h3>
                    <p className="text-xs text-muted">{description}</p>
                </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">{children}</div>
        </section>
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

    // Controlled state for every dropdown so the custom <Select> submits via
    // its hidden input and we can drive dependent fields (kelas ↔ jurusan).
    const [gender, setGender] = useState(student?.gender ?? '');
    const [bloodType, setBloodType] = useState(student?.bloodType ?? '');
    const [statusPkl, setStatusPkl] = useState(student?.status_pkl ?? 'belum');
    const [periodId, setPeriodId] = useState(
        student?.p_k_l_period_id ? String(student.p_k_l_period_id) : '',
    );
    const [departemenId, setDepartemenId] = useState(
        student?.departemen_id ? String(student.departemen_id) : '',
    );
    const [classId, setClassId] = useState(
        student?.class_id ? String(student.class_id) : '',
    );
    const [industriId, setIndustriId] = useState(
        student?.industri_id ? String(student.industri_id) : '',
    );
    const [parentId, setParentId] = useState(
        student?.parent_id ? String(student.parent_id) : '',
    );

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const passwordMatch =
        password && passwordConfirmation
            ? password === passwordConfirmation
            : null;

    const filteredClasses = departemenId
        ? options.classes.filter(
              (cls) => cls.departemen_id === Number(departemenId),
          )
        : options.classes;

    const genderOptions: SelectOption[] = [
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' },
    ];
    const bloodOptions: SelectOption[] = ['A', 'B', 'AB', 'O'].map((t) => ({
        value: t,
        label: t,
    }));
    const statusOptions: SelectOption[] = [
        { value: 'belum', label: 'Belum mulai' },
        { value: 'proses', label: 'Berjalan' },
        { value: 'selesai', label: 'Selesai' },
    ];
    const periodOptions: SelectOption[] = [
        { value: '', label: 'Tanpa periode' },
        ...options.periods.map((p) => ({
            value: String(p.id),
            label: p.name_period,
        })),
    ];
    const departemenOptions: SelectOption[] = options.departemens.map((d) => ({
        value: String(d.id),
        label: d.name,
    }));
    const classOptions: SelectOption[] = filteredClasses.map((c) => ({
        value: String(c.id),
        label: c.name,
    }));
    const industryOptions: SelectOption[] = options.industries.map((i) => ({
        value: String(i.id),
        label: i.name,
    }));
    const parentOptions: SelectOption[] = options.parents.map((p) => ({
        value: String(p.id),
        label: p.nama,
    }));

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <Section
                        icon={<UserCircle2 className="size-5" />}
                        title="Akun login"
                        description="Kredensial yang dipakai siswa untuk masuk ke SIMONIK."
                    >
                        <Field
                            label="Nama lengkap"
                            htmlFor="name"
                            error={errors.name}
                            required
                        >
                            <input
                                id="name"
                                name="name"
                                defaultValue={student?.name}
                                placeholder="cth. Budi Santoso"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="Email"
                            htmlFor="email"
                            error={errors.email}
                            required
                        >
                            <input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={student?.email}
                                placeholder="nama@sekolah.sch.id"
                                className={inputClass}
                                required
                            />
                        </Field>
                        {isCreate ? (
                            <>
                                <Field
                                    label="Kata sandi"
                                    htmlFor="password"
                                    error={errors.password}
                                    required
                                >
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            placeholder="Minimal 8 karakter"
                                            className={inputClass}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition-colors hover:text-ink"
                                            aria-label={
                                                showPassword
                                                    ? 'Sembunyikan'
                                                    : 'Tampilkan'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </Field>
                                <Field
                                    label="Konfirmasi kata sandi"
                                    htmlFor="password_confirmation"
                                    required
                                >
                                    <input
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        autoComplete="new-password"
                                        value={passwordConfirmation}
                                        onChange={(e) =>
                                            setPasswordConfirmation(
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Ulangi kata sandi"
                                        className={inputClass}
                                        required
                                    />
                                    {passwordConfirmation && (
                                        <div
                                            className={`flex items-center gap-1.5 text-xs font-medium ${passwordMatch ? 'text-positive' : 'text-red-500'}`}
                                        >
                                            {passwordMatch ? (
                                                <>
                                                    <Check className="size-3.5" />
                                                    Kata sandi cocok
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle className="size-3.5" />
                                                    Kata sandi tidak cocok
                                                </>
                                            )}
                                        </div>
                                    )}
                                </Field>
                            </>
                        ) : (
                            <>
                                <Field
                                    label="Kata sandi baru"
                                    htmlFor="password"
                                    error={errors.password}
                                    hint="Kosongkan jika tidak ingin mengubah."
                                >
                                    <div className="relative">
                                        <input
                                            id="password"
                                            name="password"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            className={inputClass}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition-colors hover:text-ink"
                                            aria-label={
                                                showPassword
                                                    ? 'Sembunyikan'
                                                    : 'Tampilkan'
                                            }
                                        >
                                            {showPassword ? (
                                                <EyeOff className="size-4" />
                                            ) : (
                                                <Eye className="size-4" />
                                            )}
                                        </button>
                                    </div>
                                </Field>
                                {password && (
                                    <Field
                                        label="Konfirmasi kata sandi"
                                        htmlFor="password_confirmation"
                                        error={errors.password_confirmation}
                                    >
                                        <input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            autoComplete="new-password"
                                            value={passwordConfirmation}
                                            onChange={(e) =>
                                                setPasswordConfirmation(
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                        {passwordConfirmation && (
                                            <div
                                                className={`flex items-center gap-1.5 text-xs font-medium ${passwordMatch ? 'text-positive' : 'text-red-500'}`}
                                            >
                                                {passwordMatch ? (
                                                    <>
                                                        <Check className="size-3.5" />
                                                        Kata sandi cocok
                                                    </>
                                                ) : (
                                                    <>
                                                        <AlertCircle className="size-3.5" />
                                                        Kata sandi tidak cocok
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </Field>
                                )}
                            </>
                        )}
                    </Section>

                    <Section
                        icon={<IdCard className="size-5" />}
                        title="Data diri"
                        description="Identitas siswa sesuai dokumen resmi."
                    >
                        <Field
                            label="NIS"
                            htmlFor="nis"
                            error={errors.nis}
                            required
                        >
                            <input
                                id="nis"
                                name="nis"
                                defaultValue={student?.nis}
                                placeholder="Nomor Induk Siswa"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="Tempat lahir"
                            htmlFor="placeOfBirth"
                            error={errors.placeOfBirth}
                            required
                        >
                            <input
                                id="placeOfBirth"
                                name="placeOfBirth"
                                defaultValue={student?.placeOfBirth}
                                placeholder="cth. Jakarta"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <Field
                            label="Tanggal lahir"
                            htmlFor="dateOfBirth"
                            error={errors.dateOfBirth}
                            required
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
                            error={errors.gender}
                            required
                        >
                            <Select
                                name="gender"
                                ariaLabel="Jenis kelamin"
                                value={gender}
                                options={genderOptions}
                                onChange={setGender}
                                placeholder="Pilih jenis kelamin…"
                            />
                        </Field>
                        <Field
                            label="Golongan darah"
                            error={errors.bloodType}
                            required
                        >
                            <Select
                                name="bloodType"
                                ariaLabel="Golongan darah"
                                value={bloodType}
                                options={bloodOptions}
                                onChange={setBloodType}
                                placeholder="Pilih golongan…"
                            />
                        </Field>
                        <Field
                            label="Foto"
                            htmlFor="image"
                            error={errors.image}
                            hint="Opsional. Format gambar, maks. beberapa MB."
                        >
                            <input
                                id="image"
                                name="image"
                                type="file"
                                accept="image/*"
                                className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-primary hover:file:text-white"
                            />
                        </Field>
                        <Field
                            label="Alamat"
                            htmlFor="alamat"
                            error={errors.alamat}
                            full
                            required
                        >
                            <textarea
                                id="alamat"
                                name="alamat"
                                rows={2}
                                defaultValue={student?.alamat}
                                placeholder="Alamat tempat tinggal siswa"
                                className={inputClass}
                                required
                            />
                        </Field>
                    </Section>

                    <Section
                        icon={<Briefcase className="size-5" />}
                        title="PKL & penempatan"
                        description="Status, periode, dan lokasi Praktik Kerja Lapangan."
                    >
                        <Field
                            label="Status PKL"
                            error={errors.status_pkl}
                            required
                        >
                            <Select
                                name="status_pkl"
                                ariaLabel="Status PKL"
                                value={statusPkl}
                                options={statusOptions}
                                onChange={setStatusPkl}
                            />
                        </Field>
                        <Field
                            label="Periode PKL"
                            error={errors.p_k_l_period_id}
                        >
                            <Select
                                name="p_k_l_period_id"
                                ariaLabel="Periode PKL"
                                value={periodId}
                                options={periodOptions}
                                onChange={setPeriodId}
                                placeholder="Tanpa periode"
                            />
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
                            error={errors.departemen_id}
                            required
                        >
                            <Select
                                name="departemen_id"
                                ariaLabel="Jurusan"
                                value={departemenId}
                                options={departemenOptions}
                                onChange={(value) => {
                                    setDepartemenId(value);
                                    setClassId('');
                                }}
                                placeholder="Pilih jurusan…"
                            />
                        </Field>
                        <Field
                            label="Kelas"
                            error={errors.class_id}
                            required
                            hint={
                                departemenId
                                    ? undefined
                                    : 'Pilih jurusan terlebih dahulu.'
                            }
                        >
                            <Select
                                name="class_id"
                                ariaLabel="Kelas"
                                value={classId}
                                options={classOptions}
                                onChange={setClassId}
                                disabled={!departemenId}
                                placeholder={
                                    departemenId
                                        ? 'Pilih kelas…'
                                        : 'Pilih jurusan dulu…'
                                }
                            />
                        </Field>
                        <Field
                            label="Industri"
                            error={errors.industri_id}
                            required
                        >
                            <Select
                                name="industri_id"
                                ariaLabel="Industri"
                                value={industriId}
                                options={industryOptions}
                                onChange={setIndustriId}
                                placeholder="Pilih industri…"
                            />
                        </Field>
                        <Field
                            label="Orang tua / wali"
                            error={errors.parent_id}
                            required
                        >
                            <Select
                                name="parent_id"
                                ariaLabel="Orang tua / wali"
                                value={parentId}
                                options={parentOptions}
                                onChange={setParentId}
                                placeholder="Pilih orang tua…"
                            />
                        </Field>
                    </Section>

                    <div className="sticky bottom-4 z-10 flex items-center justify-end gap-2 rounded-2xl border border-line bg-surface/80 p-3 shadow-lg shadow-ink/5 backdrop-blur">
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

                    {/* Bottom whitespace so dropdowns on the last rows have room to
                        open downward without being clipped at the page edge. */}
                    <div aria-hidden className="h-20" />
                </>
            )}
        </Form>
    );
}
