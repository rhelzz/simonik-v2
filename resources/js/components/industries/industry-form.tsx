import { Form, Link } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    LoaderCircle,
    MapPin,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { index } from '@/actions/App/Http/Controllers/IndustryController';
import { MapPicker } from '@/components/map-picker';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';

export type IndustryOptions = {
    teachers: { id: number; name: string }[];
    pembimbings: { id: number; name: string }[];
};

export type IndustryDefaults = {
    name?: string;
    bidang?: string;
    alamat?: string;
    longitude?: string;
    latitude?: string;
    radius?: number;
    jam_masuk?: string | null;
    jam_pulang?: string | null;
    duration?: string | null;
    teacher_id?: number | null;
    pembimbing_id?: number | null;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

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
            <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    {icon}
                </span>
                <div>
                    <h3 className="text-sm font-bold text-ink">{title}</h3>
                    <p className="text-xs text-muted">{description}</p>
                </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
    full,
    hint,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    children: ReactNode;
    full?: boolean;
    hint?: string;
}) {
    return (
        <div className={full ? 'space-y-1.5 sm:col-span-2' : 'space-y-1.5'}>
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
            </label>
            {children}
            {hint && !error && <p className="text-xs text-muted">{hint}</p>}
            {error && (
                <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="size-3.5" />
                    {error}
                </p>
            )}
        </div>
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
    const [lat, setLat] = useState(industry?.latitude ?? '-6.914744');
    const [lng, setLng] = useState(industry?.longitude ?? '107.609810');
    const [rad, setRad] = useState(industry?.radius ?? 100);
    const [teacherId, setTeacherId] = useState(
        industry?.teacher_id != null ? String(industry.teacher_id) : '',
    );
    const [pembimbingId, setPembimbingId] = useState(
        industry?.pembimbing_id != null ? String(industry.pembimbing_id) : '',
    );

    const teacherOptions: SelectOption[] = [
        { value: '', label: 'Tidak ada' },
        ...options.teachers.map((teacher) => ({
            value: String(teacher.id),
            label: teacher.name,
        })),
    ];

    const pembimbingOptions: SelectOption[] = [
        { value: '', label: 'Tidak ada' },
        ...options.pembimbings.map((pembimbing) => ({
            value: String(pembimbing.id),
            label: pembimbing.name,
        })),
    ];

    return (
        <Form action={action} method={method} className="space-y-6">
            {({ processing, errors }) => (
                <>
                    <Section
                        icon={<Building2 className="size-5" />}
                        title="Profil industri"
                        description="Identitas dan jam operasional tempat PKL."
                    >
                        <Field
                            label="Nama industri"
                            htmlFor="name"
                            error={errors.name}
                            full
                        >
                            <input
                                id="name"
                                name="name"
                                defaultValue={industry?.name}
                                placeholder="mis. PT Teknologi Nusantara"
                                className={inputClass}
                                required
                            />
                        </Field>
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
                            label="Durasi PKL"
                            htmlFor="duration"
                            error={errors.duration}
                            hint="Opsional"
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
                            label="Jam masuk kerja"
                            htmlFor="jam_masuk"
                            error={errors.jam_masuk}
                            hint="Opsional"
                        >
                            <input
                                type="time"
                                id="jam_masuk"
                                name="jam_masuk"
                                defaultValue={industry?.jam_masuk ?? ''}
                                className={inputClass}
                            />
                        </Field>
                        <Field
                            label="Jam pulang kerja"
                            htmlFor="jam_pulang"
                            error={errors.jam_pulang}
                            hint="Opsional"
                        >
                            <input
                                type="time"
                                id="jam_pulang"
                                name="jam_pulang"
                                defaultValue={industry?.jam_pulang ?? ''}
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
                                placeholder="Alamat lengkap industri"
                                className={inputClass}
                                required
                            />
                        </Field>
                    </Section>

                    <Section
                        icon={<MapPin className="size-5" />}
                        title="Lokasi & radius presensi"
                        description="Titik koordinat dan jangkauan absensi berbasis lokasi."
                    >
                        <Field
                            label="Radius jangkauan presensi (meter)"
                            htmlFor="radius"
                            error={errors.radius}
                        >
                            <input
                                type="number"
                                id="radius"
                                name="radius"
                                value={rad}
                                onChange={(e) =>
                                    setRad(parseInt(e.target.value) || 0)
                                }
                                placeholder="100"
                                className={inputClass}
                                required
                                min="10"
                            />
                        </Field>
                        <div className="hidden sm:block" />
                        <Field
                            label="Latitude"
                            htmlFor="latitude"
                            error={errors.latitude}
                        >
                            <input
                                id="latitude"
                                name="latitude"
                                value={lat}
                                onChange={(e) => setLat(e.target.value)}
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
                                value={lng}
                                onChange={(e) => setLng(e.target.value)}
                                placeholder="107.609810"
                                className={inputClass}
                                required
                            />
                        </Field>
                        <div className="sm:col-span-2">
                            <MapPicker
                                latitude={lat}
                                longitude={lng}
                                radius={rad}
                                onLocationChange={(newLat, newLng) => {
                                    setLat(newLat.toFixed(6));
                                    setLng(newLng.toFixed(6));
                                }}
                            />
                        </div>
                    </Section>

                    <Section
                        icon={<Users className="size-5" />}
                        title="Penempatan pembimbing"
                        description="Pembimbing yang dipilih otomatis menjadi pembimbing semua siswa PKL di industri ini."
                    >
                        <Field
                            label="Guru pembimbing"
                            error={errors.teacher_id}
                            hint="Opsional"
                        >
                            <Select
                                name="teacher_id"
                                ariaLabel="Guru pembimbing"
                                value={teacherId}
                                options={teacherOptions}
                                onChange={setTeacherId}
                                placeholder="Pilih guru…"
                                icon={<Users className="size-4" />}
                            />
                        </Field>
                        <Field
                            label="Pembimbing industri"
                            error={errors.pembimbing_id}
                            hint="Opsional"
                        >
                            <Select
                                name="pembimbing_id"
                                ariaLabel="Pembimbing industri"
                                value={pembimbingId}
                                options={pembimbingOptions}
                                onChange={setPembimbingId}
                                placeholder="Pilih pembimbing…"
                                icon={<Users className="size-4" />}
                            />
                        </Field>
                    </Section>

                    {/* Action bar */}
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
