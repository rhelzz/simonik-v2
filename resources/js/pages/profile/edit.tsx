import { Form, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    Check,
    CheckCircle2,
    Eye,
    EyeOff,
    IdCard,
    Info,
    LoaderCircle,
    MapPin,
    ShieldCheck,
    UserCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { update as updatePassword } from '@/actions/App/Http/Controllers/PasswordController';
import {
    update as updateProfile,
    updateStudentProfile,
} from '@/actions/App/Http/Controllers/ProfileController';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import type { Role } from '@/types/auth';

type StudentProfile = {
    nis: string | null;
    placeOfBirth: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    bloodType: string | null;
    alamat: string | null;
    image: string | null;
    complete: boolean;
};

type IndustryProfile = {
    id: number;
    nib: string | null;
    name: string;
    bidang: string;
    alamat: string;
    rt: string | null;
    rw: string | null;
    dusun: string | null;
    kelurahan: string | null;
    kecamatan: string | null;
    kode_pos: string | null;
    latitude: string | null;
    longitude: string | null;
    email: string | null;
    website: string | null;
    npwp: string | null;
    complete: boolean;
};

type ProfileEditProps = {
    profile: { name: string; email: string };
    student: StudentProfile | null;
    industry?: IndustryProfile | null;
};

const roleLabels: Record<Role, string> = {
    admin: 'Administrator',
    wakasek: 'Wakil Kepala Sekolah',
    kaprog: 'Kepala Program',
    guru: 'Guru Pembimbing',
    pembimbing: 'Pembimbing Industri',
    siswa: 'Siswa',
    orangtua: 'Orang Tua',
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function initials(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';

    return (first + last).toUpperCase() || 'U';
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
            {children}
        </section>
    );
}

function Field({
    label,
    htmlFor,
    error,
    hint,
    required,
    full,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    full?: boolean;
    children: ReactNode;
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

function PasswordToggle({
    show,
    onToggle,
}: {
    show: boolean;
    onToggle: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted transition-colors hover:text-ink"
            aria-label={
                show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
            }
        >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
    );
}

function SubmitButton({
    processing,
    children,
}: {
    processing: boolean;
    children: ReactNode;
}) {
    return (
        <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
            {processing && <LoaderCircle className="size-4 animate-spin" />}
            {children}
        </button>
    );
}

export default function ProfileEdit({
    profile,
    student,
    industry,
}: ProfileEditProps) {
    const { auth } = usePage<SharedData>().props;
    const roles = auth.roles ?? [];
    const isPembimbing = roles.includes('pembimbing');

    const [activeTab, setActiveTab] = useState<'account' | 'industry'>(
        'account',
    );

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('tab') === 'industry' && isPembimbing) {
            setActiveTab('industry');
        }
    }, [isPembimbing]);

    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [gender, setGender] = useState(student?.gender ?? '');
    const [bloodType, setBloodType] = useState(student?.bloodType ?? '');

    // State form industri untuk progress bar real-time
    const [industryForm, setIndustryForm] = useState({
        nib: industry?.nib ?? '',
        name: industry?.name ?? '',
        bidang: industry?.bidang ?? '',
        alamat: industry?.alamat ?? '',
        rt: industry?.rt ?? '',
        rw: industry?.rw ?? '',
        dusun: industry?.dusun ?? '',
        kelurahan: industry?.kelurahan ?? '',
        kecamatan: industry?.kecamatan ?? '',
        kode_pos: industry?.kode_pos ?? '',
        latitude: industry?.latitude ?? '',
        longitude: industry?.longitude ?? '',
        email: industry?.email ?? '',
        website: industry?.website ?? '',
        npwp: industry?.npwp ?? '',
    });

    const handleIndustryChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setIndustryForm((prev) => ({ ...prev, [name]: value }));
    };

    const dudiFields = useMemo(() => {
        return [
            { key: 'nib', label: 'NIB', val: industryForm.nib },
            { key: 'name', label: 'Nama Perusahaan', val: industryForm.name },
            { key: 'bidang', label: 'Bidang Usaha', val: industryForm.bidang },
            { key: 'alamat', label: 'Alamat Lokasi', val: industryForm.alamat },
            { key: 'rt', label: 'RT', val: industryForm.rt },
            { key: 'rw', label: 'RW', val: industryForm.rw },
            { key: 'dusun', label: 'Nama Dusun', val: industryForm.dusun },
            {
                key: 'kelurahan',
                label: 'Desa/Kelurahan',
                val: industryForm.kelurahan,
            },
            {
                key: 'kecamatan',
                label: 'Kecamatan',
                val: industryForm.kecamatan,
            },
            { key: 'kode_pos', label: 'Kode Pos', val: industryForm.kode_pos },
            { key: 'latitude', label: 'Lintang', val: industryForm.latitude },
            { key: 'longitude', label: 'Bujur', val: industryForm.longitude },
            { key: 'email', label: 'Email', val: industryForm.email },
            { key: 'website', label: 'Website', val: industryForm.website },
            { key: 'npwp', label: 'NPWP', val: industryForm.npwp },
        ];
    }, [industryForm]);

    const filledDudiCount = useMemo(() => {
        return dudiFields.filter((f) => f.val && f.val.trim().length > 0).length;
    }, [dudiFields]);

    const progressPercentage = Math.round(
        (filledDudiCount / dudiFields.length) * 100,
    );

    const genderOptions: SelectOption[] = [
        { value: 'L', label: 'Laki-laki' },
        { value: 'P', label: 'Perempuan' },
    ];
    const bloodOptions: SelectOption[] = [
        { value: '', label: '— Tidak tahu' },
        ...['A', 'B', 'AB', 'O'].map((t) => ({ value: t, label: t })),
    ];

    const passwordMatch =
        password && confirmation ? password === confirmation : null;

    return (
        <AppLayout title="Pengaturan Akun">
            <div className="space-y-6">
                {/* Kartu identitas */}
                <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-[#3a3f9e] p-5 text-white sm:p-6">
                    <div className="absolute -top-16 -right-12 size-52 rounded-full bg-white/10 blur-2xl" />
                    <div className="relative flex items-center gap-4">
                        <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-extrabold backdrop-blur">
                            {initials(profile.name)}
                        </span>
                        <div className="min-w-0">
                            <h2 className="truncate text-xl font-extrabold tracking-tight">
                                {profile.name}
                            </h2>
                            <p className="truncate text-sm text-white/70">
                                {profile.email}
                            </p>
                            {roles.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {roles.map((role) => (
                                        <span
                                            key={role}
                                            className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur"
                                        >
                                            {roleLabels[role] ?? role}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Tab Menu Header untuk Role Pembimbing / Industri */}
                {isPembimbing && (
                    <div className="flex border-b border-line">
                        <button
                            type="button"
                            onClick={() => setActiveTab('account')}
                            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                                activeTab === 'account'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-ink'
                            }`}
                        >
                            <UserCircle2 className="size-4" />
                            Informasi Akun
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('industry')}
                            className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
                                activeTab === 'industry'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-ink'
                            }`}
                        >
                            <Building2 className="size-4" />
                            Profil Industri
                            {industry && (
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        industry.complete
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-amber-100 text-amber-700'
                                    }`}
                                >
                                    {industry.complete ? 'Lengkap' : `${progressPercentage}%`}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* Konten Tab: Informasi Akun */}
                {(activeTab === 'account' || !isPembimbing) && (
                    <div className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
                            {/* Informasi akun */}
                            <Section
                                icon={<UserCircle2 className="size-5" />}
                                title="Informasi akun"
                                description="Perbarui nama dan email akun Anda."
                            >
                                <Form
                                    action={updateProfile.url()}
                                    method="patch"
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <Field
                                                label="Nama lengkap"
                                                htmlFor="name"
                                                error={errors.name}
                                                required
                                            >
                                                <input
                                                    id="name"
                                                    name="name"
                                                    defaultValue={profile.name}
                                                    placeholder="Nama lengkap Anda"
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
                                                    defaultValue={profile.email}
                                                    placeholder="nama@simonik.local"
                                                    className={inputClass}
                                                    required
                                                />
                                            </Field>
                                            <div className="flex justify-end">
                                                <SubmitButton
                                                    processing={processing}
                                                >
                                                    Simpan perubahan
                                                </SubmitButton>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </Section>

                            {/* Keamanan */}
                            <Section
                                icon={<ShieldCheck className="size-5" />}
                                title="Keamanan"
                                description="Gunakan kata sandi yang panjang dan unik agar akun tetap aman."
                            >
                                <Form
                                    action={updatePassword.url()}
                                    method="put"
                                    resetOnSuccess
                                    onSuccess={() => {
                                        setPassword('');
                                        setConfirmation('');
                                    }}
                                    className="space-y-4"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <Field
                                                label="Kata sandi saat ini"
                                                htmlFor="current_password"
                                                error={errors.current_password}
                                                required
                                            >
                                                <div className="relative">
                                                    <input
                                                        id="current_password"
                                                        name="current_password"
                                                        type={
                                                            showPassword
                                                                ? 'text'
                                                                : 'password'
                                                        }
                                                        autoComplete="current-password"
                                                        className={inputClass}
                                                        required
                                                    />
                                                </div>
                                            </Field>
                                            <Field
                                                label="Kata sandi baru"
                                                htmlFor="password"
                                                error={errors.password}
                                                hint="Minimal 8 karakter."
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
                                                            setPassword(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Kata sandi baru"
                                                        className={inputClass}
                                                        required
                                                    />
                                                    <PasswordToggle
                                                        show={showPassword}
                                                        onToggle={() =>
                                                            setShowPassword(
                                                                !showPassword,
                                                            )
                                                        }
                                                    />
                                                </div>
                                            </Field>
                                            <Field
                                                label="Konfirmasi kata sandi baru"
                                                htmlFor="password_confirmation"
                                                required
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
                                                    value={confirmation}
                                                    onChange={(e) =>
                                                        setConfirmation(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Ulangi kata sandi baru"
                                                    className={inputClass}
                                                    required
                                                />
                                                {confirmation && (
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
                                                                Kata sandi tidak
                                                                cocok
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </Field>
                                            <div className="flex justify-end">
                                                <SubmitButton
                                                    processing={processing}
                                                >
                                                    Perbarui kata sandi
                                                </SubmitButton>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </Section>
                        </div>

                        {student && (
                            <Section
                                icon={<IdCard className="size-5" />}
                                title="Data diri"
                                description="Lengkapi identitas Anda sesuai dokumen resmi. Boleh dicicil — tidak semua wajib diisi sekarang."
                            >
                                {!student.complete && (
                                    <p className="mb-4 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                                        <AlertCircle className="size-3.5 shrink-0" />
                                        Belum lengkap
                                    </p>
                                )}
                                <Form
                                    action={updateStudentProfile.url()}
                                    method="patch"
                                    encType="multipart/form-data"
                                >
                                    {({ processing, errors }) => (
                                        <>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field
                                                    label="NIS"
                                                    htmlFor="nis"
                                                    error={errors.nis}
                                                >
                                                    <input
                                                        id="nis"
                                                        name="nis"
                                                        defaultValue={
                                                            student.nis ?? ''
                                                        }
                                                        placeholder="Nomor Induk Siswa"
                                                        className={inputClass}
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
                                                        defaultValue={
                                                            student.placeOfBirth ??
                                                            ''
                                                        }
                                                        placeholder="cth. Jakarta"
                                                        className={inputClass}
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
                                                        defaultValue={
                                                            student.dateOfBirth ??
                                                            ''
                                                        }
                                                        className={inputClass}
                                                    />
                                                </Field>
                                                <Field
                                                    label="Jenis kelamin"
                                                    error={errors.gender}
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
                                                >
                                                    <Select
                                                        name="bloodType"
                                                        ariaLabel="Golongan darah"
                                                        value={bloodType}
                                                        options={bloodOptions}
                                                        onChange={setBloodType}
                                                        placeholder="— Tidak tahu"
                                                    />
                                                </Field>
                                                <Field
                                                    label="Foto"
                                                    htmlFor="image"
                                                    error={errors.image}
                                                    hint="Opsional. Format gambar, maks. 2MB."
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
                                                >
                                                    <textarea
                                                        id="alamat"
                                                        name="alamat"
                                                        rows={2}
                                                        defaultValue={
                                                            student.alamat ?? ''
                                                        }
                                                        placeholder="Alamat tempat tinggal Anda"
                                                        className={inputClass}
                                                    />
                                                </Field>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <SubmitButton
                                                    processing={processing}
                                                >
                                                    Simpan data diri
                                                </SubmitButton>
                                            </div>
                                        </>
                                    )}
                                </Form>
                            </Section>
                        )}
                    </div>
                )}

                {/* Konten Tab: Profil Industri (DUDI) */}
                {isPembimbing && activeTab === 'industry' && (
                    <div className="space-y-6">
                        {!industry ? (
                            <div className="rounded-3xl border border-line bg-surface p-6 text-center text-muted">
                                <Building2 className="mx-auto mb-2 size-8 text-muted" />
                                <p className="font-semibold text-ink">
                                    Belum Terhubung dengan Data Industri
                                </p>
                                <p className="text-xs">
                                    Akun Anda belum dikaitkan dengan data industri oleh Administrator/Kaprog.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Alert Pengingat e-Rapor */}
                                <div
                                    className={`relative flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${
                                        industry.complete || progressPercentage === 100
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                                            : 'border-amber-200 bg-amber-50 text-amber-900'
                                    }`}
                                >
                                    {industry.complete || progressPercentage === 100 ? (
                                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    ) : (
                                        <Info className="mt-0.5 size-5 shrink-0 text-amber-600" />
                                    )}
                                    <div className="flex-1 text-sm">
                                        <h4 className="font-bold">
                                            {industry.complete || progressPercentage === 100
                                                ? 'Data Profil Industri Lengkap'
                                                : 'Pemberitahuan Kelengkapan Data Industri (DUDI)'}
                                        </h4>
                                        <p className="mt-1 text-xs leading-relaxed opacity-90">
                                            {industry.complete || progressPercentage === 100
                                                ? 'Terima kasih, seluruh rincian informasi data industri telah lengkap untuk kebutuhan sinkronisasi e-Rapor Kemendikdasmen.'
                                                : 'Harap melengkapi data Profil Industri (DUDI) di bawah ini. Fitur kebutuhan input data profil industri ini diperuntukkan melengkapi data inputan e-Rapor Kemendikdasmen.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress Bar Card */}
                                <div className="rounded-3xl border border-line bg-surface p-5 sm:p-6">
                                    <div className="mb-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                                                Kelengkapan Data DUDI
                                            </span>
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                                {filledDudiCount} dari 15 Field
                                            </span>
                                        </div>
                                        <span className="text-sm font-extrabold text-primary">
                                            {progressPercentage}%
                                        </span>
                                    </div>

                                    {/* Bar track */}
                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-canvas">
                                        <div
                                            className={`h-full transition-all duration-300 ease-out ${
                                                progressPercentage === 100
                                                    ? 'bg-emerald-500'
                                                    : 'bg-primary'
                                            }`}
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>

                                    {progressPercentage < 100 && (
                                        <p className="mt-2 text-[11px] text-muted">
                                            Field yang belum diisi:{' '}
                                            <span className="font-medium text-amber-700">
                                                {dudiFields
                                                    .filter(
                                                        (f) =>
                                                            !f.val ||
                                                            f.val.trim().length === 0,
                                                    )
                                                    .map((f) => f.label)
                                                    .join(', ')}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Form Input DUDI */}
                                <Section
                                    icon={<Building2 className="size-5" />}
                                    title="Data Relasi Dunia Usaha dan Dunia Industri (DUDI)"
                                    description="Isi dan lengkapi data profil industri untuk sinkronisasi administrasi."
                                >
                                    <Form
                                        action="/profile/industri"
                                        method="patch"
                                        className="space-y-4"
                                    >
                                        {({ processing, errors }) => (
                                            <>
                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    {/* 1. NIB */}
                                                    <Field
                                                        label="Nomor Induk Berusaha (NIB)"
                                                        htmlFor="nib"
                                                        error={errors.nib}
                                                        hint="cth. 9120001234567"
                                                    >
                                                        <input
                                                            id="nib"
                                                            name="nib"
                                                            value={industryForm.nib}
                                                            onChange={handleIndustryChange}
                                                            placeholder="Nomor Induk Berusaha"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 2. Nama Perusahaan */}
                                                    <Field
                                                        label="Nama Perusahaan"
                                                        htmlFor="name"
                                                        error={errors.name}
                                                        required
                                                    >
                                                        <input
                                                            id="name"
                                                            name="name"
                                                            value={industryForm.name}
                                                            onChange={handleIndustryChange}
                                                            placeholder="Nama PT / Studio / Perusahaan"
                                                            className={inputClass}
                                                            required
                                                        />
                                                    </Field>

                                                    {/* 3. Bidang Usaha */}
                                                    <Field
                                                        label="Bidang Usaha"
                                                        htmlFor="bidang"
                                                        error={errors.bidang}
                                                        required
                                                    >
                                                        <input
                                                            id="bidang"
                                                            name="bidang"
                                                            value={industryForm.bidang}
                                                            onChange={handleIndustryChange}
                                                            placeholder="cth. Teknologi Informasi / Rekayasa Perangkat Lunak"
                                                            className={inputClass}
                                                            required
                                                        />
                                                    </Field>

                                                    {/* 4. NPWP */}
                                                    <Field
                                                        label="NPWP Perusahaan"
                                                        htmlFor="npwp"
                                                        error={errors.npwp}
                                                        hint="cth. 01.234.567.8-901.000"
                                                    >
                                                        <input
                                                            id="npwp"
                                                            name="npwp"
                                                            value={industryForm.npwp}
                                                            onChange={handleIndustryChange}
                                                            placeholder="NPWP Perusahaan"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 5. Alamat Lokasi */}
                                                    <Field
                                                        label="Alamat Lokasi Perusahaan"
                                                        htmlFor="alamat"
                                                        error={errors.alamat}
                                                        full
                                                        required
                                                    >
                                                        <textarea
                                                            id="alamat"
                                                            name="alamat"
                                                            rows={2}
                                                            value={industryForm.alamat}
                                                            onChange={handleIndustryChange}
                                                            placeholder="Jalan, Gedung, No. Kantor"
                                                            className={inputClass}
                                                            required
                                                        />
                                                    </Field>

                                                    {/* 6. RT */}
                                                    <Field
                                                        label="RT"
                                                        htmlFor="rt"
                                                        error={errors.rt}
                                                    >
                                                        <input
                                                            id="rt"
                                                            name="rt"
                                                            value={industryForm.rt}
                                                            onChange={handleIndustryChange}
                                                            placeholder="cth. 001"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 7. RW */}
                                                    <Field
                                                        label="RW"
                                                        htmlFor="rw"
                                                        error={errors.rw}
                                                    >
                                                        <input
                                                            id="rw"
                                                            name="rw"
                                                            value={industryForm.rw}
                                                            onChange={handleIndustryChange}
                                                            placeholder="cth. 005"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 8. Nama Dusun */}
                                                    <Field
                                                        label="Nama Dusun"
                                                        htmlFor="dusun"
                                                        error={errors.dusun}
                                                    >
                                                        <input
                                                            id="dusun"
                                                            name="dusun"
                                                            value={industryForm.dusun}
                                                            onChange={handleIndustryChange}
                                                            placeholder="Nama Dusun / Lingkungan"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 9. Desa / Kelurahan */}
                                                    <Field
                                                        label="Desa / Kelurahan"
                                                        htmlFor="kelurahan"
                                                        error={errors.kelurahan}
                                                    >
                                                        <input
                                                            id="kelurahan"
                                                            name="kelurahan"
                                                            value={industryForm.kelurahan}
                                                            onChange={handleIndustryChange}
                                                            placeholder="Desa atau Kelurahan"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 10. Kecamatan */}
                                                    <Field
                                                        label="Kecamatan"
                                                        htmlFor="kecamatan"
                                                        error={errors.kecamatan}
                                                    >
                                                        <input
                                                            id="kecamatan"
                                                            name="kecamatan"
                                                            value={industryForm.kecamatan}
                                                            onChange={handleIndustryChange}
                                                            placeholder="Kecamatan"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 11. Kode Pos */}
                                                    <Field
                                                        label="Kode Pos"
                                                        htmlFor="kode_pos"
                                                        error={errors.kode_pos}
                                                    >
                                                        <input
                                                            id="kode_pos"
                                                            name="kode_pos"
                                                            value={industryForm.kode_pos}
                                                            onChange={handleIndustryChange}
                                                            placeholder="cth. 40123"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 12. Lintang (Latitude) */}
                                                    <Field
                                                        label="Lintang (Latitude)"
                                                        htmlFor="latitude"
                                                        error={errors.latitude}
                                                        hint="cth. -6.917464"
                                                    >
                                                        <div className="relative">
                                                            <input
                                                                id="latitude"
                                                                name="latitude"
                                                                value={industryForm.latitude}
                                                                onChange={handleIndustryChange}
                                                                placeholder="-6.xxxxx"
                                                                className={inputClass}
                                                            />
                                                            <MapPin className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                                                        </div>
                                                    </Field>

                                                    {/* 13. Bujur (Longitude) */}
                                                    <Field
                                                        label="Bujur (Longitude)"
                                                        htmlFor="longitude"
                                                        error={errors.longitude}
                                                        hint="cth. 107.619123"
                                                    >
                                                        <div className="relative">
                                                            <input
                                                                id="longitude"
                                                                name="longitude"
                                                                value={industryForm.longitude}
                                                                onChange={handleIndustryChange}
                                                                placeholder="107.xxxxx"
                                                                className={inputClass}
                                                            />
                                                            <MapPin className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
                                                        </div>
                                                    </Field>

                                                    {/* 14. Email Perusahaan */}
                                                    <Field
                                                        label="Email Perusahaan"
                                                        htmlFor="email"
                                                        error={errors.email}
                                                    >
                                                        <input
                                                            id="email"
                                                            name="email"
                                                            type="email"
                                                            value={industryForm.email}
                                                            onChange={handleIndustryChange}
                                                            placeholder="hrd@perusahaan.com"
                                                            className={inputClass}
                                                        />
                                                    </Field>

                                                    {/* 15. Website Perusahaan */}
                                                    <Field
                                                        label="Website Perusahaan"
                                                        htmlFor="website"
                                                        error={errors.website}
                                                        hint="cth. https://perusahaan.com"
                                                    >
                                                        <input
                                                            id="website"
                                                            name="website"
                                                            value={industryForm.website}
                                                            onChange={handleIndustryChange}
                                                            placeholder="https://..."
                                                            className={inputClass}
                                                        />
                                                    </Field>
                                                </div>

                                                <div className="mt-6 flex justify-end">
                                                    <SubmitButton
                                                        processing={processing}
                                                    >
                                                        Simpan Profil Industri
                                                    </SubmitButton>
                                                </div>
                                            </>
                                        )}
                                    </Form>
                                </Section>
                            </>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
