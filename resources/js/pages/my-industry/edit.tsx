import { Form, Link } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    show,
    update,
} from '@/actions/App/Http/Controllers/MyIndustryController';
import { MapPicker } from '@/components/map-picker';
import { AppLayout } from '@/layouts/app-layout';

type Industry = {
    id: number;
    name: string;
    bidang: string;
    alamat: string;
    longitude: string;
    latitude: string;
    radius: number;
    jam_masuk: string | null;
    jam_pulang: string | null;
    duration: string | null;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export default function MyIndustryEdit({ industry }: { industry: Industry }) {
    const [lat, setLat] = useState(industry.latitude || '-6.914744');
    const [lng, setLng] = useState(industry.longitude || '107.609810');
    const [rad, setRad] = useState(industry.radius || 100);

    return (
        <AppLayout title="Edit Industri Saya">
            <Form action={update.url()} method="put" className="space-y-8">
                {({ processing, errors }) => (
                    <>
                        <section className="rounded-3xl bg-surface p-5 sm:p-6">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <h3 className="text-xs font-semibold tracking-[0.12em] text-muted uppercase sm:col-span-2">
                                    Profil industri
                                </h3>
                                <Field
                                    label="Nama industri"
                                    htmlFor="name"
                                    error={errors.name}
                                    full
                                >
                                    <input
                                        id="name"
                                        name="name"
                                        defaultValue={industry.name}
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
                                        defaultValue={industry.bidang}
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
                                        defaultValue={industry.duration ?? ''}
                                        placeholder="mis. 6 Bulan"
                                        className={inputClass}
                                    />
                                </Field>
                                <Field
                                    label="Jam Masuk Kerja (opsional)"
                                    htmlFor="jam_masuk"
                                    error={errors.jam_masuk}
                                >
                                    <input
                                        type="time"
                                        id="jam_masuk"
                                        name="jam_masuk"
                                        defaultValue={industry.jam_masuk ?? ''}
                                        className={inputClass}
                                    />
                                </Field>
                                <Field
                                    label="Jam Pulang Kerja (opsional)"
                                    htmlFor="jam_pulang"
                                    error={errors.jam_pulang}
                                >
                                    <input
                                        type="time"
                                        id="jam_pulang"
                                        name="jam_pulang"
                                        defaultValue={industry.jam_pulang ?? ''}
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
                                        defaultValue={industry.alamat}
                                        className={inputClass}
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Radius Jangkauan Presensi (meter)"
                                    htmlFor="radius"
                                    error={errors.radius}
                                >
                                    <input
                                        type="number"
                                        id="radius"
                                        name="radius"
                                        value={rad}
                                        onChange={(e) => setRad(parseInt(e.target.value) || 0)}
                                        placeholder="100"
                                        className={inputClass}
                                        required
                                        min="10"
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

                                <div className="sm:col-span-2 mt-2">
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
                            </div>
                        </section>

                        <div className="flex items-center justify-end gap-2">
                            <Link
                                href={show.url()}
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
                                Simpan perubahan
                            </button>
                        </div>
                    </>
                )}
            </Form>
        </AppLayout>
    );
}

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
