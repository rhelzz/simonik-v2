import { Link, router } from '@inertiajs/react';
import { ArrowLeft, MapPin, Pencil } from 'lucide-react';
import { useState } from 'react';
import {
    edit,
    index,
    updateCoordinates,
} from '@/actions/App/Http/Controllers/IndustryController';
import { MapPicker } from '@/components/map-picker';
import { MapViewer } from '@/components/map-viewer';
import { AppLayout } from '@/layouts/app-layout';

type IndustryShowProps = {
    industry: {
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
        guru: string | null;
        pembimbing: string | null;
        pembimbing_no_hp: string | null;
    };
    students: Array<{
        id: number;
        name: string;
        nis: string;
        status_pkl: string;
        class: string | null;
    }>;
    can: { manage: boolean; updateCoordinates: boolean };
};

/**
 * Atur titik & radius absensi langsung dari halaman detail.
 *
 * Guru pembimbing tidak punya akses ke form edit industri (itu milik
 * admin/kaprog), padahal ia berwenang menentukan titik absensi industri
 * bimbingannya. Blok ini memberi satu-satunya bagian yang boleh ia ubah.
 */
function CoordinateEditor({
    industry,
}: {
    industry: IndustryShowProps['industry'];
}) {
    const [lat, setLat] = useState(industry.latitude || '-6.914744');
    const [lng, setLng] = useState(industry.longitude || '107.609810');
    const [radius, setRadius] = useState(industry.radius || 100);
    const [saving, setSaving] = useState(false);

    function save() {
        setSaving(true);
        router.patch(
            updateCoordinates.url(industry.id),
            { latitude: lat, longitude: lng, radius },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <div className="mt-6 rounded-2xl border border-line p-4">
            <h3 className="text-sm font-bold text-ink">
                Atur titik & radius absensi
            </h3>
            <p className="mt-0.5 text-xs text-muted">
                Geser penanda di peta, atau isi koordinat langsung. Siswa hanya
                bisa absen di dalam radius ini.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <label className="text-xs font-medium text-muted">
                    Latitude
                    <input
                        value={lat}
                        onChange={(event) => setLat(event.target.value)}
                        className={coordinateInputClass}
                    />
                </label>
                <label className="text-xs font-medium text-muted">
                    Longitude
                    <input
                        value={lng}
                        onChange={(event) => setLng(event.target.value)}
                        className={coordinateInputClass}
                    />
                </label>
                <label className="text-xs font-medium text-muted">
                    Radius (meter)
                    <input
                        type="number"
                        min={10}
                        max={5000}
                        value={radius}
                        onChange={(event) =>
                            setRadius(Number(event.target.value))
                        }
                        className={coordinateInputClass}
                    />
                </label>
            </div>

            <div className="mt-4">
                <MapPicker
                    latitude={lat}
                    longitude={lng}
                    radius={radius}
                    onLocationChange={(newLat, newLng) => {
                        setLat(newLat.toFixed(6));
                        setLng(newLng.toFixed(6));
                    }}
                />
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                    <MapPin className="size-4" />
                    Simpan titik absensi
                </button>
            </div>
        </div>
    );
}

const coordinateInputClass =
    'mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm font-normal text-ink focus:border-primary focus:outline-none';

const statusLabels: Record<string, string> = {
    belum: 'Belum mulai',
    proses: 'Berjalan',
    selesai: 'Selesai',
};

const statusStyles: Record<string, string> = {
    belum: 'bg-canvas text-muted',
    proses: 'bg-warning/15 text-warning',
    selesai: 'bg-positive/15 text-positive',
};

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
            </p>
            <p className="text-sm text-ink">{value || '—'}</p>
        </div>
    );
}

export default function IndustryShow({
    industry,
    students,
    can,
}: IndustryShowProps) {
    return (
        <AppLayout title={`Detail Industri - ${industry.name}`}>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href={index.url()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali
                    </Link>
                    {can.manage && (
                        <Link
                            href={edit.url(industry.id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            <Pencil className="size-4" />
                            Edit
                        </Link>
                    )}
                </div>

                {/* Informasi Industri */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        {industry.name}
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem label="Bidang" value={industry.bidang} />
                        <DetailItem label="Alamat" value={industry.alamat} />
                        <DetailItem
                            label="Durasi PKL"
                            value={
                                industry.duration
                                    ? `${industry.duration} bulan`
                                    : null
                            }
                        />
                        <DetailItem
                            label="Koordinat"
                            value={
                                industry.latitude && industry.longitude
                                    ? `${industry.latitude}, ${industry.longitude} (${industry.radius}m)`
                                    : null
                            }
                        />
                        <DetailItem
                            label="Jam Kerja"
                            value={
                                industry.jam_masuk && industry.jam_pulang
                                    ? `${industry.jam_masuk} - ${industry.jam_pulang}`
                                    : 'Belum diatur'
                            }
                        />
                    </div>
                    {can.updateCoordinates ? (
                        <CoordinateEditor industry={industry} />
                    ) : (
                        industry.latitude &&
                        industry.longitude && (
                            <div className="mt-6">
                                <MapViewer
                                    latitude={industry.latitude}
                                    longitude={industry.longitude}
                                    radius={industry.radius}
                                />
                            </div>
                        )
                    )}
                </section>

                {/* Pembimbing */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        Pembimbing
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem
                            label="Guru Pembimbing"
                            value={industry.guru}
                        />
                        <DetailItem
                            label="Pembimbing Industri"
                            value={industry.pembimbing}
                        />
                        <DetailItem
                            label="No. HP Pembimbing"
                            value={industry.pembimbing_no_hp}
                        />
                    </div>
                </section>

                {/* Daftar Siswa PKL */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        Siswa PKL ({students.length})
                    </h2>
                    {students.length === 0 ? (
                        <p className="text-sm text-muted">
                            Belum ada siswa yang ditempatkan di industri ini.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                        <th className="pb-3 font-semibold">
                                            Nama
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            NIS
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Kelas
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Status PKL
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {students.map((student) => (
                                        <tr key={student.id}>
                                            <td className="py-3 font-medium text-ink">
                                                {student.name}
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {student.nis}
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {student.class ?? '—'}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[student.status_pkl] ?? 'bg-canvas text-muted'}`}
                                                >
                                                    {statusLabels[
                                                        student.status_pkl
                                                    ] ?? student.status_pkl}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
