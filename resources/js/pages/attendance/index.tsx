import { Link, useForm } from '@inertiajs/react';
import {
    CalendarCheck,
    CheckCircle2,
    Clock,
    Eye,
    FileText,
    LoaderCircle,
    LogOut,
    MapPin,
} from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import {
    absence,
    checkIn,
    checkOut,
    show as showUrl,
} from '@/actions/App/Http/Controllers/AttendanceController';
import type { EmotionKey } from '@/components/photo-capture';
import { EMOTION_INFO, PhotoCapture } from '@/components/photo-capture';
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
    isLate: boolean;
    isSuspect: boolean;
    absenceReason: string | null;
    image: string | null;
    emotion: EmotionKey | null;
    departureImage: string | null;
    departureEmotion: EmotionKey | null;
    latitude: string | null;
    longitude: string | null;
};

type AttendanceIndexProps = {
    today: AttendanceRecord | null;
    history: Paginated<AttendanceRecord>;
    todayLabel: string;
    industry: {
        name: string;
        jam_masuk: string | null;
        jam_pulang: string | null;
    } | null;
};

function EmotionBadge({ emotion }: { emotion: EmotionKey }) {
    const info = EMOTION_INFO[emotion];

    return (
        <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <span aria-hidden>{info.emoji}</span>
            <span>{info.label}</span>
        </div>
    );
}

export default function AttendanceIndex({
    today,
    history,
    todayLabel,
    industry,
}: AttendanceIndexProps) {
    return (
        <AppLayout title="Absen Foto + Geo">
            <div className="grid gap-5 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <TodayCard today={today} todayLabel={todayLabel} industry={industry} />
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
                            <table className="w-full min-w-lg border-collapse text-left text-sm">
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
                                        <th className="pb-3 text-right font-semibold">
                                            Detail
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
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <span>{row.arrivalTime ?? '—'}</span>
                                                    {row.isLate && (
                                                        <span className="inline-flex rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                                                            Terlambat
                                                        </span>
                                                    )}
                                                    {row.isSuspect && (
                                                        <span className="inline-flex rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-800 dark:bg-rose-950/30 dark:text-rose-400" title="Koordinat atau akurasi GPS mencurigakan">
                                                            Mencurigakan
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 text-ink/80">
                                                {row.departureTime ?? '—'}
                                            </td>
                                            <td className="py-3 text-right">
                                                <Link
                                                    href={showUrl.url(row.id)}
                                                    className="inline-grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                    aria-label="Lihat detail"
                                                >
                                                    <Eye className="size-4" />
                                                </Link>
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
    industry,
}: {
    today: AttendanceRecord | null;
    todayLabel: string;
    industry: {
        name: string;
        jam_masuk: string | null;
        jam_pulang: string | null;
    } | null;
}) {
    const isPresent =
        today !== null &&
        ['hadir', 'masuk'].includes((today.status ?? '').toLowerCase());

    const hasJam = industry?.jam_masuk && industry?.jam_pulang;

    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-muted">
                    <CalendarCheck className="size-4" />
                    {todayLabel}
                </div>
                {hasJam && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Clock className="size-3.5" />
                        <span>Jam Kerja: {industry.jam_masuk} - {industry.jam_pulang}</span>
                    </div>
                )}
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
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                            Foto Masuk
                        </p>
                        <div className="relative">
                            <img
                                src={today.image}
                                alt="Foto absen masuk"
                                className="aspect-4/3 w-full rounded-2xl border border-line object-cover"
                            />
                            {today.emotion && (
                                <EmotionBadge emotion={today.emotion} />
                            )}
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <p className="text-xs font-semibold tracking-widest text-muted uppercase">
                            Foto Pulang
                        </p>
                        {today.departureImage ? (
                            <div className="relative">
                                <img
                                    src={today.departureImage}
                                    alt="Foto absen pulang"
                                    className="aspect-4/3 w-full rounded-2xl border border-line object-cover"
                                />
                                {today.departureEmotion && (
                                    <EmotionBadge
                                        emotion={today.departureEmotion}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="flex aspect-4/3 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-muted">
                                <LogOut className="size-5" />
                                <p className="text-xs font-medium">
                                    Belum absen pulang
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!done && <CheckOutPanel />}
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

function CheckOutPanel() {
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    const form = useForm<{
        image: File | null;
        emotion: string;
        latitude: string;
        longitude: string;
        gps_accuracy: string;
    }>({
        image: null,
        emotion: '',
        latitude: '',
        longitude: '',
        gps_accuracy: '',
    });

    const hasLocation = form.data.latitude !== '' && form.data.longitude !== '';

    function captureLocation() {
        if (!navigator.geolocation) {
            setGeoError('Geolokasi tidak didukung browser ini.');

            return;
        }

        if (!window.isSecureContext) {
            setGeoError(
                'Geolokasi memerlukan HTTPS. Untuk dev lokal: akses via http://localhost:8000, atau buka chrome://flags/#unsafely-treat-insecure-origin-as-secure dan tambahkan URL ini.',
            );

            return;
        }

        setGeoLoading(true);
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                form.setData((oldData) => ({
                    ...oldData,
                    latitude: String(pos.coords.latitude),
                    longitude: String(pos.coords.longitude),
                    gps_accuracy: String(pos.coords.accuracy),
                }));
                setGeoLoading(false);
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setGeoError(
                        'Akses lokasi ditolak. Izinkan akses lokasi di browser.',
                    );
                } else if (err.code === err.TIMEOUT) {
                    setGeoError('Waktu habis mengambil lokasi. Coba lagi.');
                } else {
                    setGeoError('Gagal mengambil lokasi. Pastikan GPS aktif.');
                }

                setGeoLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post(checkOut.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => form.reset(),
        });
    }

    return (
        <form onSubmit={submit} className="space-y-3">
            <p className="text-sm font-semibold text-ink">Absen pulang</p>
            <PhotoCapture
                onCapture={(file, emotion) => {
                    form.setData('image', file);
                    form.setData('emotion', emotion ?? '');
                }}
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
                        {form.data.gps_accuracy && ` (±${Math.round(Number(form.data.gps_accuracy))}m)`}
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
                    <LogOut className="size-4" />
                )}
                Absen pulang
            </button>
        </form>
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
        gps_accuracy: string;
        description: string;
        emotion: string;
    }>({
        image: null,
        latitude: '',
        longitude: '',
        gps_accuracy: '',
        description: '',
        emotion: '',
    });

    const hasLocation = form.data.latitude !== '' && form.data.longitude !== '';

    function captureLocation() {
        if (!navigator.geolocation) {
            setGeoError('Geolokasi tidak didukung browser ini.');

            return;
        }

        if (!window.isSecureContext) {
            setGeoError(
                'Geolokasi memerlukan HTTPS. Untuk dev lokal: akses via http://localhost:8000, atau buka chrome://flags/#unsafely-treat-insecure-origin-as-secure dan tambahkan URL ini.',
            );

            return;
        }

        setGeoLoading(true);
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                form.setData((oldData) => ({
                    ...oldData,
                    latitude: String(pos.coords.latitude),
                    longitude: String(pos.coords.longitude),
                    gps_accuracy: String(pos.coords.accuracy),
                }));
                setGeoLoading(false);
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setGeoError(
                        'Akses lokasi ditolak. Izinkan akses lokasi di browser.',
                    );
                } else if (err.code === err.TIMEOUT) {
                    setGeoError('Waktu habis mengambil lokasi. Coba lagi.');
                } else {
                    setGeoError('Gagal mengambil lokasi. Pastikan GPS aktif.');
                }

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
                onCapture={(file, emotion) => {
                    form.setData('image', file);
                    form.setData('emotion', emotion ?? '');
                }}
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
                        {form.data.gps_accuracy && ` (±${Math.round(Number(form.data.gps_accuracy))}m)`}
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
