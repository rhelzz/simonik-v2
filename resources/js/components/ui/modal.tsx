import { X } from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

export function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKey);

        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    return (
        /* Layar pendek (HP, atau HP dalam posisi mendatar) membuat form lebih
           tinggi dari viewport. Overlay ikut menggulung dan panel dibatasi
           tingginya agar tombol Simpan selalu terjangkau. */
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain p-4 sm:items-center">
            <div
                onClick={onClose}
                className="fixed inset-0 bg-ink/30 backdrop-blur-sm"
            />
            <div className="relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col rounded-3xl bg-surface shadow-xl">
                <div className="flex items-center justify-between gap-3 p-6 pb-4">
                    <h2 className="min-w-0 text-base font-bold text-ink">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink"
                    >
                        <X className="size-5" />
                    </button>
                </div>
                <div className="scrollbar-slim min-h-0 flex-1 overflow-y-auto px-6 pb-6">
                    {children}
                </div>
            </div>
        </div>
    );
}
