import { Download, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Event beforeinstallprompt belum ada di lib DOM standar.
 */
interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Mendaftarkan service worker dari root (`/sw.js`, scope '/') dan menampilkan:
 * - toast "versi baru tersedia" saat SW baru menunggu (registerType: 'prompt'), dan
 * - tombol "Pasang aplikasi" saat browser mengizinkan install ke homescreen.
 *
 * SW hanya aktif di production build; saat `npm run dev` file `/sw.js` 404 → dilewati.
 */
export function PwaPrompt() {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
        null,
    );
    const [installEvent, setInstallEvent] =
        useState<BeforeInstallPromptEvent | null>(null);

    useEffect(() => {
        if (!('serviceWorker' in navigator) || import.meta.env.DEV) {
            return;
        }

        let refreshing = false;
        const onControllerChange = () => {
            if (refreshing) {
                return;
            }

            refreshing = true;
            window.location.reload();
        };
        navigator.serviceWorker.addEventListener(
            'controllerchange',
            onControllerChange,
        );

        navigator.serviceWorker
            .register('/sw.js', { scope: '/' })
            .then((registration) => {
                if (registration.waiting) {
                    setWaitingWorker(registration.waiting);
                    setNeedRefresh(true);
                }

                registration.addEventListener('updatefound', () => {
                    const installing = registration.installing;

                    if (!installing) {
                        return;
                    }

                    installing.addEventListener('statechange', () => {
                        if (
                            installing.state === 'installed' &&
                            navigator.serviceWorker.controller
                        ) {
                            setWaitingWorker(installing);
                            setNeedRefresh(true);
                        }
                    });
                });
            })
            .catch(() => {
                // SW belum tersedia (mis. mode dev) — abaikan.
            });

        return () => {
            navigator.serviceWorker.removeEventListener(
                'controllerchange',
                onControllerChange,
            );
        };
    }, []);

    useEffect(() => {
        const onBeforeInstall = (event: Event) => {
            event.preventDefault();
            setInstallEvent(event as BeforeInstallPromptEvent);
        };
        const onInstalled = () => setInstallEvent(null);

        window.addEventListener('beforeinstallprompt', onBeforeInstall);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstall);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    const applyUpdate = () => {
        waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
        setNeedRefresh(false);
    };

    const install = async () => {
        if (!installEvent) {
            return;
        }

        await installEvent.prompt();
        await installEvent.userChoice;
        setInstallEvent(null);
    };

    if (!needRefresh && !installEvent) {
        return null;
    }

    return (
        <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm flex-col gap-2 lg:right-6 lg:left-auto">
            {needRefresh && (
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg">
                    <RefreshCw className="size-5 shrink-0 text-primary" />
                    <div className="flex-1 text-sm">
                        <p className="font-semibold text-ink">
                            Versi baru tersedia
                        </p>
                        <p className="text-ink/60">
                            Muat ulang untuk memperbarui.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={applyUpdate}
                        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                    >
                        Perbarui
                    </button>
                    <button
                        type="button"
                        onClick={() => setNeedRefresh(false)}
                        aria-label="Tutup"
                        className="text-ink/40 hover:text-ink"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {installEvent && (
                <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-lg">
                    <Download className="size-5 shrink-0 text-primary" />
                    <div className="flex-1 text-sm">
                        <p className="font-semibold text-ink">Pasang SIMONIK</p>
                        <p className="text-ink/60">
                            Akses lebih cepat langsung dari homescreen.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={install}
                        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white"
                    >
                        Pasang
                    </button>
                    <button
                        type="button"
                        onClick={() => setInstallEvent(null)}
                        aria-label="Tutup"
                        className="text-ink/40 hover:text-ink"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
