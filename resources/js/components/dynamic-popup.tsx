import { usePage } from '@inertiajs/react';
import {
    Bell,
    Calendar,
    Gift,
    Info,
    Megaphone,
    Smartphone,
    Sparkles,
    TriangleAlert,
    X,
} from 'lucide-react';
import { useState } from 'react';
import type { DynamicPopupData, SharedData } from '@/types';

const STORAGE_KEY = 'simonik_popup_last_shown';

export function PopupIcon({
    name,
    className = 'size-8',
}: {
    name?: string;
    className?: string;
}) {
    switch (name) {
        case 'bell':
            return <Bell className={className} />;
        case 'info':
            return <Info className={className} />;
        case 'triangle-alert':
            return <TriangleAlert className={className} />;
        case 'sparkles':
            return <Sparkles className={className} />;
        case 'calendar':
            return <Calendar className={className} />;
        case 'megaphone':
            return <Megaphone className={className} />;
        case 'gift':
            return <Gift className={className} />;
        case 'smartphone':
        default:
            return <Smartphone className={className} />;
    }
}

function shouldShowPopup(popup?: DynamicPopupData | null): boolean {
    if (!popup?.active || typeof window === 'undefined') {
        return false;
    }

    const intervalMs = (popup.interval_minutes ?? 5) * 60 * 1000;
    const lastShown = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    return (
        intervalMs === 0 || !lastShown || now - Number(lastShown) >= intervalMs
    );
}

export function DynamicPopup() {
    const { dynamicPopup } = usePage<SharedData>().props;
    const [open, setOpen] = useState(() => shouldShowPopup(dynamicPopup));

    function handleClose() {
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
        setOpen(false);
    }

    function handleActionClick() {
        handleClose();

        if (dynamicPopup?.button_url && dynamicPopup.button_url !== '#') {
            window.open(
                dynamicPopup.button_url,
                '_blank',
                'noopener,noreferrer',
            );
        }
    }

    if (!open || !dynamicPopup || !dynamicPopup.active) {
        return null;
    }

    return (
        <div className="pointer-events-auto relative w-full rounded-2xl border border-line bg-surface p-5 text-center shadow-xl">
            <button
                type="button"
                onClick={handleClose}
                aria-label="Tutup"
                className="absolute top-3 right-3 text-muted transition-colors hover:text-ink"
            >
                <X className="size-4" />
            </button>

            {/* Illustration Icon */}
            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <PopupIcon name={dynamicPopup.icon} className="size-6" />
            </div>

            <h3 className="text-sm font-bold text-ink">
                {dynamicPopup.title}
            </h3>

            {dynamicPopup.description && (
                <p className="mt-1.5 text-xs text-muted">
                    {dynamicPopup.description}
                </p>
            )}

            {dynamicPopup.has_button && (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={handleActionClick}
                        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-blue-700"
                    >
                        {dynamicPopup.button_text}
                    </button>
                </div>
            )}
        </div>
    );
}
