import { Camera, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Pengambilan foto absen via kamera langsung (getUserMedia) sebagai bukti
 * kehadiran — preview & hasil di-mirror agar sesuai pandangan pengguna.
 * Hasil selalu berupa `File` yang dikirim ke parent lewat `onCapture`.
 */
export function PhotoCapture({
    onCapture,
    disabled = false,
}: {
    onCapture: (file: File | null) => void;
    disabled?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
        }

        return () => {
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [stream]);

    function stopStream() {
        stream?.getTracks().forEach((track) => track.stop());
        setStream(null);
    }

    async function startCamera() {
        setError(null);

        if (!window.isSecureContext) {
            setError(
                'Kamera memerlukan HTTPS. Akses via https:// atau localhost.',
            );

            return;
        }

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Kamera tidak tersedia di perangkat ini.');

            return;
        }

        try {
            let next: MediaStream;

            try {
                next = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user' },
                    audio: false,
                });
            } catch {
                next = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false,
                });
            }

            setStream(next);
        } catch (err) {
            const name = err instanceof DOMException ? err.name : '';

            if (
                name === 'NotAllowedError' ||
                name === 'PermissionDeniedError'
            ) {
                setError(
                    'Akses kamera ditolak. Klik ikon kunci/kamera di address bar browser lalu izinkan, kemudian muat ulang halaman.',
                );
            } else if (
                name === 'NotFoundError' ||
                name === 'DevicesNotFoundError'
            ) {
                setError(
                    'Kamera tidak ditemukan. Pastikan webcam terpasang dan terdeteksi sistem.',
                );
            } else if (
                name === 'NotReadableError' ||
                name === 'TrackStartError'
            ) {
                setError(
                    'Kamera sedang dipakai aplikasi lain (Zoom, Teams, dll). Tutup aplikasi tersebut lalu coba lagi.',
                );
            } else if (
                name === 'OverconstrainedError' ||
                name === 'ConstraintNotSatisfiedError'
            ) {
                setError('Kamera tidak mendukung konfigurasi yang diminta.');
            } else {
                setError(
                    'Tidak bisa mengakses kamera. Pastikan izin kamera sudah diaktifkan di browser.',
                );
            }
        }
    }

    function capture() {
        const video = videoRef.current;

        if (!video) {
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(video, 0, 0);
        }

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    return;
                }

                const file = new File([blob], `absen-${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                });
                setPreview(URL.createObjectURL(file));
                onCapture(file);
                stopStream();
            },
            'image/jpeg',
            0.85,
        );
    }

    function reset() {
        setPreview(null);
        onCapture(null);
    }

    return (
        <div className="space-y-3">
            <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border border-line bg-canvas">
                {preview ? (
                    <img
                        src={preview}
                        alt="Pratinjau foto absen"
                        className="size-full object-cover"
                    />
                ) : stream ? (
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="size-full scale-x-[-1] object-cover"
                    />
                ) : (
                    <div className="grid size-full place-items-center text-center">
                        <div className="flex flex-col items-center gap-1 text-muted">
                            <Camera className="size-8" />
                            <p className="text-sm font-medium">
                                Belum ada foto
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
                {preview ? (
                    <button
                        type="button"
                        onClick={reset}
                        disabled={disabled}
                        className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-60"
                    >
                        <RotateCcw className="size-4" />
                        Ulangi
                    </button>
                ) : stream ? (
                    <>
                        <button
                            type="button"
                            onClick={capture}
                            disabled={disabled}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            <Camera className="size-4" />
                            Ambil foto
                        </button>
                        <button
                            type="button"
                            onClick={stopStream}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                        >
                            Batal
                        </button>
                    </>
                ) : (
                    <button
                        type="button"
                        onClick={startCamera}
                        disabled={disabled}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                    >
                        <Camera className="size-4" />
                        Buka kamera
                    </button>
                )}
            </div>
        </div>
    );
}
