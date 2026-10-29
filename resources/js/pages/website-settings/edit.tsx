import { useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Bell,
    Calendar,
    Gift,
    Globe,
    Info,
    LoaderCircle,
    Megaphone,
    Smartphone,
    Sparkles,
    TriangleAlert,
    UploadCloud,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { update } from '@/actions/App/Http/Controllers/WebsiteSettingController';
import { PopupIcon } from '@/components/dynamic-popup';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

export type PopupSetting = {
    popup_active: boolean;
    popup_icon: string;
    popup_title: string;
    popup_description: string;
    popup_has_button: boolean;
    popup_button_text: string;
    popup_button_url: string;
    popup_interval_minutes: number;
};

type WebsiteSettingsProps = {
    favicon: { url: string; updatedAt: string | null };
    popup: PopupSetting;
};

const PRESET_ICONS = [
    { id: 'smartphone', label: 'Aplikasi', icon: Smartphone },
    { id: 'bell', label: 'Notifikasi', icon: Bell },
    { id: 'info', label: 'Informasi', icon: Info },
    { id: 'triangle-alert', label: 'Peringatan', icon: TriangleAlert },
    { id: 'sparkles', label: 'Fitur Baru', icon: Sparkles },
    { id: 'calendar', label: 'Agenda', icon: Calendar },
    { id: 'megaphone', label: 'Megafon', icon: Megaphone },
    { id: 'gift', label: 'Hadiah', icon: Gift },
];

const INTERVAL_OPTIONS: SelectOption[] = [
    { value: '0', label: 'Setiap kali website dibuka' },
    { value: '5', label: 'Tampilkan setiap [ 5 ] Menit sekali' },
    { value: '10', label: 'Tampilkan setiap [ 10 ] Menit sekali' },
    { value: '15', label: 'Tampilkan setiap [ 15 ] Menit sekali' },
    { value: '30', label: 'Tampilkan setiap [ 30 ] Menit sekali' },
    { value: '60', label: 'Tampilkan setiap [ 60 ] Menit sekali' },
    { value: '1440', label: 'Tampilkan setiap [ 1 ] Hari sekali' },
];

function ToggleSwitch({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (val: boolean) => void;
    label?: string;
}) {
    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                    checked ? 'bg-amber-500' : 'bg-line',
                )}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
                        checked ? 'translate-x-5' : 'translate-x-0',
                    )}
                />
            </button>
            {label && (
                <span className="text-xs font-semibold text-ink">{label}</span>
            )}
        </div>
    );
}

export default function WebsiteSettingsEdit({
    favicon,
    popup,
}: WebsiteSettingsProps) {
    // Favicon state & form
    const [preview, setPreview] = useState<string | null>(null);
    const faviconForm = useForm<{ favicon: File | null }>({ favicon: null });

    // Popup state & form
    const popupForm = useForm<PopupSetting>({
        popup_active: popup.popup_active,
        popup_icon: popup.popup_icon || 'smartphone',
        popup_title: popup.popup_title || 'Informasi Penting!',
        popup_description:
            popup.popup_description ||
            'Dapatkan update terbaru dengan mengunduh aplikasi resmi kami langsung di perangkat Anda!',
        popup_has_button: popup.popup_has_button,
        popup_button_text: popup.popup_button_text || 'Unduh Sekarang',
        popup_button_url: popup.popup_button_url || '',
        popup_interval_minutes: popup.popup_interval_minutes ?? 5,
    });

    function onFaviconFile(file: File | null) {
        faviconForm.setData('favicon', file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function submitFavicon(event: FormEvent) {
        event.preventDefault();
        faviconForm.transform((data) => ({ ...data, _method: 'put' }));
        faviconForm.post(update.url(), {
            forceFormData: true,
            preserveScroll: true,
        });
    }

    function submitPopup(event: FormEvent) {
        event.preventDefault();
        popupForm.put('/pengaturan-website/popup', {
            preserveScroll: true,
        });
    }

    function resetPopupForm() {
        popupForm.setData({
            popup_active: popup.popup_active,
            popup_icon: popup.popup_icon || 'smartphone',
            popup_title: popup.popup_title || 'Informasi Penting!',
            popup_description:
                popup.popup_description ||
                'Dapatkan update terbaru dengan mengunduh aplikasi resmi kami langsung di perangkat Anda!',
            popup_has_button: popup.popup_has_button,
            popup_button_text: popup.popup_button_text || 'Unduh Sekarang',
            popup_button_url: popup.popup_button_url || '',
            popup_interval_minutes: popup.popup_interval_minutes ?? 5,
        });
    }

    const inputClass =
        'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

    return (
        <AppLayout title="Website Settings">
            <div className="space-y-6">
                {/* Bagian Pop Up Dinamis */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="mb-6 flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                            <Sparkles className="size-5" />
                        </span>
                        <div>
                            <h2 className="text-base font-bold text-ink">
                                Pengaturan Pop Up Dinamis
                            </h2>
                            <p className="text-xs text-muted">
                                Kontrol pop up informasi kustom yang muncul saat
                                pengguna membuka situs.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-12">
                        {/* Form Kolom Kiri */}
                        <form
                            onSubmit={submitPopup}
                            className="space-y-4 lg:col-span-7"
                        >
                            {/* Pilihan Ikon Preset */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-ink">
                                    Ikon Pop Up
                                </label>
                                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                                    {PRESET_ICONS.map((item) => {
                                        const IconComponent = item.icon;
                                        const isSelected =
                                            popupForm.data.popup_icon ===
                                            item.id;

                                        return (
                                            <button
                                                key={item.id}
                                                type="button"
                                                onClick={() =>
                                                    popupForm.setData(
                                                        'popup_icon',
                                                        item.id,
                                                    )
                                                }
                                                className={cn(
                                                    'flex flex-col items-center justify-center gap-1 rounded-xl border p-2 text-center transition-all',
                                                    isSelected
                                                        ? 'border-blue-600 bg-blue-50/70 text-blue-600 ring-2 ring-blue-600/20'
                                                        : 'border-line bg-canvas/30 text-muted hover:border-ink/20 hover:text-ink',
                                                )}
                                                title={item.label}
                                            >
                                                <IconComponent className="size-4 shrink-0" />
                                                <span className="max-w-full truncate text-[10px] font-medium">
                                                    {item.label}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Judul Pop Up */}
                            <div>
                                <label
                                    htmlFor="popup_title"
                                    className="mb-1.5 block text-xs font-semibold text-ink"
                                >
                                    Judul Pop Up
                                </label>
                                <input
                                    id="popup_title"
                                    type="text"
                                    value={popupForm.data.popup_title}
                                    onChange={(e) =>
                                        popupForm.setData(
                                            'popup_title',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="cth. Informasi Penting!"
                                    className={inputClass}
                                    required
                                />
                                {popupForm.errors.popup_title && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {popupForm.errors.popup_title}
                                    </p>
                                )}
                            </div>

                            {/* Deskripsi Pop Up */}
                            <div>
                                <label
                                    htmlFor="popup_description"
                                    className="mb-1.5 block text-xs font-semibold text-ink"
                                >
                                    Deskripsi Pop Up
                                </label>
                                <textarea
                                    id="popup_description"
                                    rows={3}
                                    value={popupForm.data.popup_description}
                                    onChange={(e) =>
                                        popupForm.setData(
                                            'popup_description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Tulis deskripsi atau pesan pop up..."
                                    className={inputClass}
                                />
                                {popupForm.errors.popup_description && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {popupForm.errors.popup_description}
                                    </p>
                                )}
                            </div>

                            {/* Status Pop Up Aktif */}
                            <div className="flex items-center justify-between rounded-2xl border border-line bg-canvas/30 p-3.5">
                                <div>
                                    <p className="text-xs font-semibold text-ink">
                                        Status Pop Up
                                    </p>
                                    <p className="text-xs text-muted">
                                        Aktifkan untuk mulai menayangkan pop up
                                        ke pengunjung
                                    </p>
                                </div>
                                <ToggleSwitch
                                    checked={popupForm.data.popup_active}
                                    onChange={(val) =>
                                        popupForm.setData('popup_active', val)
                                    }
                                    label={
                                        popupForm.data.popup_active
                                            ? 'AKTIF'
                                            : 'NONAKTIF'
                                    }
                                />
                            </div>

                            {/* Pengaturan Tombol Aksi */}
                            <div className="space-y-3 rounded-2xl border border-line bg-canvas/30 p-3.5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-semibold text-ink">
                                            Tombol Aksi
                                        </p>
                                        <p className="text-xs text-muted">
                                            Sertakan tombol link aksi di dalam
                                            pop up
                                        </p>
                                    </div>
                                    <ToggleSwitch
                                        checked={
                                            popupForm.data.popup_has_button
                                        }
                                        onChange={(val) =>
                                            popupForm.setData(
                                                'popup_has_button',
                                                val,
                                            )
                                        }
                                        label={
                                            popupForm.data.popup_has_button
                                                ? 'ON'
                                                : 'OFF'
                                        }
                                    />
                                </div>

                                {popupForm.data.popup_has_button && (
                                    <div className="grid gap-3 pt-2 sm:grid-cols-2">
                                        <div>
                                            <label
                                                htmlFor="popup_button_text"
                                                className="mb-1 block text-xs font-medium text-ink"
                                            >
                                                Nama Tombol
                                            </label>
                                            <input
                                                id="popup_button_text"
                                                type="text"
                                                value={
                                                    popupForm.data
                                                        .popup_button_text
                                                }
                                                onChange={(e) =>
                                                    popupForm.setData(
                                                        'popup_button_text',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="cth. Unduh Sekarang"
                                                className={inputClass}
                                            />
                                        </div>
                                        <div>
                                            <label
                                                htmlFor="popup_button_url"
                                                className="mb-1 block text-xs font-medium text-ink"
                                            >
                                                Link Tombol (URL)
                                            </label>
                                            <input
                                                id="popup_button_url"
                                                type="text"
                                                value={
                                                    popupForm.data
                                                        .popup_button_url
                                                }
                                                onChange={(e) =>
                                                    popupForm.setData(
                                                        'popup_button_url',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="https://..."
                                                className={inputClass}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Interval Muncul */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-ink">
                                    Interval Muncul
                                </label>
                                <Select
                                    value={String(
                                        popupForm.data.popup_interval_minutes,
                                    )}
                                    options={INTERVAL_OPTIONS}
                                    onChange={(val) =>
                                        popupForm.setData(
                                            'popup_interval_minutes',
                                            Number(val),
                                        )
                                    }
                                />
                                <p className="mt-1 text-xs text-muted">
                                    Frekuensi pop up akan muncul kembali ke
                                    perangkat pengguna saat membuka situs.
                                </p>
                            </div>

                            {/* Tombol Simpan & Batal */}
                            <div className="flex items-center gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={popupForm.processing}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                                >
                                    {popupForm.processing && (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    )}
                                    Simpan Pengaturan
                                </button>
                                <button
                                    type="button"
                                    onClick={resetPopupForm}
                                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-canvas hover:text-ink"
                                >
                                    Batal
                                </button>
                            </div>
                        </form>

                        {/* Kolom Kanan: Pratinjau Pop Up (Live Preview) */}
                        <div className="flex flex-col lg:col-span-5">
                            <h3 className="mb-3 text-xs font-semibold text-ink">
                                Pratinjau Pop Up (Live Preview)
                            </h3>
                            <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-line bg-canvas/60 p-6">
                                {/* Simulated backdrop overlay */}
                                <div className="backdrop-blur-2xs absolute inset-0 bg-ink/10" />

                                {/* Preview Card */}
                                <div className="relative z-10 w-full max-w-xs rounded-2xl border border-line bg-surface p-5 text-center shadow-lg">
                                    <button
                                        type="button"
                                        aria-label="Tutup preview"
                                        className="absolute top-3 right-3 text-muted hover:text-ink"
                                    >
                                        <X className="size-4" />
                                    </button>

                                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                        <PopupIcon
                                            name={popupForm.data.popup_icon}
                                            className="size-6"
                                        />
                                    </div>

                                    <h4 className="text-sm font-bold text-ink">
                                        {popupForm.data.popup_title ||
                                            'Informasi Penting!'}
                                    </h4>

                                    <p className="mt-1.5 line-clamp-4 text-xs text-muted">
                                        {popupForm.data.popup_description ||
                                            'Dapatkan update terbaru dengan mengunduh aplikasi resmi kami langsung di perangkat Anda!'}
                                    </p>

                                    {popupForm.data.popup_has_button && (
                                        <div className="mt-4">
                                            <div className="w-full rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-xs">
                                                {popupForm.data
                                                    .popup_button_text ||
                                                    'Unduh Sekarang'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Bagian Favicon Situs */}
                <section className="max-w-xl rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="mb-5 flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                            <Globe className="size-5" />
                        </span>
                        <div>
                            <h3 className="text-sm font-bold text-ink">
                                Favicon situs
                            </h3>
                            <p className="text-xs text-muted">
                                Ikon yang tampil di tab browser. Berkas ICO,
                                PNG, JPG, atau SVG, maksimal 512 KB.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={submitFavicon} className="space-y-4">
                        <div className="flex items-center gap-4">
                            <img
                                src={preview ?? favicon.url}
                                alt="Favicon saat ini"
                                className="size-12 rounded-lg border border-line bg-canvas/40 object-contain p-1.5"
                            />
                            <label
                                htmlFor="favicon"
                                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary hover:text-primary"
                            >
                                <UploadCloud className="size-4" />
                                Pilih favicon
                            </label>
                            <input
                                id="favicon"
                                type="file"
                                accept=".ico,.png,.jpg,.jpeg,.svg,image/x-icon,image/vnd.microsoft.icon,image/png,image/jpeg,image/svg+xml"
                                className="hidden"
                                onChange={(event) =>
                                    onFaviconFile(
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </div>
                        {faviconForm.errors.favicon && (
                            <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                                <AlertCircle className="size-3.5 shrink-0" />
                                {faviconForm.errors.favicon}
                            </p>
                        )}
                        {favicon.updatedAt && (
                            <p className="text-xs text-muted">
                                Terakhir diperbarui{' '}
                                {new Date(favicon.updatedAt).toLocaleString(
                                    'id-ID',
                                )}
                            </p>
                        )}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={
                                    faviconForm.processing ||
                                    !faviconForm.data.favicon
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                            >
                                {faviconForm.processing && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Simpan favicon
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </AppLayout>
    );
}
