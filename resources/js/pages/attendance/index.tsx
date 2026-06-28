import { router, useForm } from '@inertiajs/react';
import {
    CalendarCheck,
    CheckCircle2,
    Clock,
    FileText,
    LoaderCircle,
    LogOut,
    MapPin,
    ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
    absence,
    checkIn,
    checkOut,
} from '@/actions/App/Http/Controllers/AttendanceController';
import { PhotoCapture } from '@/components/photo-capture';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import { attendanceLabel, attendanceStyle } from '@/lib/attendance';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type AttendanceRecord = {
    id: number;
    date: string;
    dateLabel: string;
    status: string | null;
    arrivalTime: string | null;
    departureTime: string | null;
    absenceReason: string | null;
    image: string | null;
    latitude: string | null;
    longitude: string | null;
    verified: boolean;
};

type AttendanceIndexProps = {
    today: AttendanceRecord | null;
    history: Paginated<AttendanceRecord>;
    todayLabel: string;
};

export default function AttendanceIndex({
    today,
    history,
    todayLabel,
}: AttendanceIndexProps) {
    return (
        <AppLayout title="Absen Foto + Geo">
            <div className="grid gap-5 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <TodayCard today={today} todayLabel={todayLabel} />
                </div>
                <section className="rounded-3xl bg-surface p-5 sm:p-6 lg:col-span-3">
                    <h2 className="text-base font-bold text-ink">
                        Riwayat absen
                    </h2>
                    <p className="text-sm text-muted">
                        {history.total} catatan kehadiran
                    </p>

                    {history.data.length === 0 ? (
                        <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-12 text-center">
                            <CalendarCheck className="size-8 text-muted" />
                            <p className="text-sm font-medium text-ink">
                                Belum ada riwayat
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-128 border-collapse text-left text-sm">
                                <thead>
                                    <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                        <th className="pb-3 font-semibold">
                                            Tanggal
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Status
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Masuk
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Pulang
                                        </th>
                                        <th className="pb-3 font-semibold">
                                            Verifikasi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-line">
                                    {history.data.map((row) => (
                                        <tr key={row.id}>
                                            <td className="py-3 font-medium text-ink">
                                                {row.dateLabel}
                                            </td>
                                            <td className="py-3">
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                        attendanceStyle(
                                                            row.status,
                                                        ),
                                                    )}
                                                >
                                                    {attendanceLabel(
                                                        row.status,
                                                    )}
                                                </span>
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {row.arrivalTime ?? '—'}
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {row.departureTime ?? '—'}
                                            </td>
                                            <td className="py-3">
                                                {row.verified ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-positive">
                                                        <ShieldCheck className="size-3.5" />
                                                        Terverifikasi
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted">
                                                        Menunggu
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <Pagination meta={history} />
                </section>
            </div>
        </AppLayout>
    );
}

function TodayCard({
    today,
    todayLabel,
}: {
    today: AttendanceRecord | null;
    todayLabel: string;
}) {
    const isPresent =
        today !== null &&
        ['hadir', 'masuk'].includes((today.status ?? '').toLowerCase());

    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm text-muted">
                <CalendarCheck className="size-4" />
                {todayLabel}
            </div>

            {today === null ? (
                <CheckInPanel />
            ) : isPresent ? (
                <PresentState today={today} />
            ) : (
                <AbsenceState today={today} />
            )}
        </section>
    );
}

function PresentState({ today }: { today: AttendanceRecord }) {
    const done = today.departureTime !== null;

    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-positive/10 p-4">
                <CheckCircle2 className="size-6 text-positive" />
                <div>
                    <p className="text-sm font-bold text-ink">
                        {done ? 'Absen hari ini selesai' : 'Sudah absen masuk'}
                    </p>
                    <p className="text-xs text-muted">
                        Masuk {today.arrivalTime}
                        {done ? ` · Pulang ${today.departureTime}` : ''}
                    </p>
                </div>
            </div>

            {today.image && (
                <img
                    src={today.image}
                    alt="Foto absen"
                    className="aspect-[4/3] w-full rounded-2xl border border-line object-cover"
                />
            )}

            {!done && <CheckOutButton />}
        </div>
    );
}

function AbsenceState({ today }: { today: AttendanceRecord }) {
    return (
        <div className="mt-4 space-y-3">
            <span
                className={cn(
                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                    attendanceStyle(today.status),
                )}
            >
                {attendanceLabel(today.status)}
            </span>
            {today.absenceReason && (
                <p className="text-sm text-ink/80">{today.absenceReason}</p>
            )}
            <p className="text-xs text-muted">
                Pengajuan telah direkam untuk hari ini.
            </p>
        </div>
    );
}

function CheckOutButton() {
    const [processing, setProcessing] = useState(false);

    function submit() {
        router.post(
            checkOut.url(),
            {},
            {
                preserveScroll: true,
                onStart: () => setProcessing(true),
                onFinish: () => setProcessing(false),
            },
        );
    }

    return (
        <button
            type="button"
            onClick={submit}
            disabled={processing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
            {processing ? (
                <LoaderCircle className="size-4 animate-spin" />
            ) : (
                <LogOut className="size-4" />
            )}
            Absen pulang
        </button>
    );
}

function CheckInPanel() {
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [absenceOpen, setAbsenceOpen] = useState(false);

    const form = useForm<{
        image: File | null;
        latitude: string;
        longitude: string;
        description: string;
    }>({ image: null, latitude: '', longitude: '', description: '' });

    const hasLocation = form.data.latitude !== '' && form.data.longitude !== '';

    function captureLocation() {
        if (!navigator.geolocation) {
            setGeoError('Geolokasi tidak didukung browser ini.');

            return;
        }

        setGeoLoading(true);
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                form.setData('latitude', String(pos.coords.latitude));
                form.setData('longitude', String(pos.coords.longitude));
                setGeoLoading(false);
            },
            () => {
                setGeoError('Gagal mengambil lokasi. Izinkan akses lokasi.');
                setGeoLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(checkIn.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <form onSubmit={submit} className="mt-4 space-y-4">
            <p className="text-sm font-semibold text-ink">
                Belum absen hari ini
            </p>

            <PhotoCapture
                onCapture={(file) => form.setData('image', file)}
                disabled={form.processing}
            />
            {form.errors.image && (
                <p className="text-xs font-medium text-red-500">
                    {form.errors.image}
                </p>
            )}

            <div className="space-y-2">
                <button
                    type="button"
                    onClick={captureLocation}
                    disabled={geoLoading}
                    className={cn(
                        'inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60',
                        hasLocation
                            ? 'border-positive/40 bg-positive/10 text-positive'
                            : 'border-line text-ink hover:bg-canvas',
                    )}
                >
                    {geoLoading ? (
                        <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                        <MapPin className="size-4" />
                    )}
                    {hasLocation ? 'Lokasi terekam' : 'Ambil lokasi'}
                </button>
                {hasLocation && (
                    <p className="text-center text-xs text-muted">
                        {Number(form.data.latitude).toFixed(5)},{' '}
                        {Number(form.data.longitude).toFixed(5)}
                    </p>
                )}
                {(geoError ||
                    form.errors.latitude ||
                    form.errors.longitude) && (
                    <p className="text-xs font-medium text-red-500">
                        {geoError ??
                            form.errors.latitude ??
                            form.errors.longitude}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={form.processing || !form.data.image || !hasLocation}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
            >
                {form.processing ? (
                    <LoaderCircle className="size-4 animate-spin" />
                ) : (
                    <Clock className="size-4" />
                )}
                Absen masuk
            </button>

            <button
                type="button"
                onClick={() => setAbsenceOpen(true)}
                className="inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-primary"
            >
                <FileText className="size-4" />
                Ajukan izin / sakit
            </button>

            <AbsenceModal
                open={absenceOpen}
                onClose={() => setAbsenceOpen(false)}
            />
        </form>
    );
}

function AbsenceModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const form = useForm<{
        status: string;
        absenceReason: string;
        image: File | null;
    }>({ status: 'izin', absenceReason: '', image: null });

    function close() {
        form.reset();
        form.clearErrors();
        onClose();
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(absence.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: close,
        });
    }

    function onFile(event: ChangeEvent<HTMLInputElement>) {
        form.setData('image', event.target.files?.[0] ?? null);
    }

    const inputClass =
        'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

    return (
        <Modal open={open} onClose={close} title="Ajukan izin / sakit">
            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                    <label
                        htmlFor="status"
                        className="text-sm font-medium text-ink"
                    >
                        Jenis
                    </label>
                    <select
                        id="status"
                        value={form.data.status}
                        onChange={(event) =>
                            form.setData('status', event.target.value)
                        }
                        className={inputClass}
                    >
                        <option value="izin">Izin</option>
                        <option value="sakit">Sakit</option>
                    </select>
                    {form.errors.status && (
                        <p className="text-xs font-medium text-red-500">
                            {form.errors.status}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="absenceReason"
                        className="text-sm font-medium text-ink"
                    >
                        Alasan
                    </label>
                    <textarea
                        id="absenceReason"
                        value={form.data.absenceReason}
                        onChange={(event) =>
                            form.setData('absenceReason', event.target.value)
                        }
                        rows={3}
                        placeholder="Jelaskan alasan singkat…"
                        className={inputClass}
                    />
                    {form.errors.absenceReason && (
                        <p className="text-xs font-medium text-red-500">
                            {form.errors.absenceReason}
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="absence-image"
                        className="text-sm font-medium text-ink"
                    >
                        Lampiran (opsional)
                    </label>
                    <input
                        id="absence-image"
                        type="file"
                        accept="image/*"
                        onChange={onFile}
                        className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-canvas file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-ink"
                    />
                    {form.errors.image && (
                        <p className="text-xs font-medium text-red-500">
                            {form.errors.image}
                        </p>
                    )}
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
                        Kirim
                    </button>
                </div>
            </form>
        </Modal>
    );
}
