import { Camera, RotateCcw, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';

/**
 * Pengambilan foto absen. Mengutamakan kamera langsung (getUserMedia) sebagai
 * bukti kehadiran, dengan opsi unggah berkas bila kamera tidak tersedia.
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

        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Kamera tidak tersedia di perangkat ini. Unggah foto.');

            return;
        }

        try {
            const next = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false,
            });
            setStream(next);

            if (videoRef.current) {
                videoRef.current.srcObject = next;
                await videoRef.current.play();
            }
        } catch {
            setError(
                'Tidak bisa mengakses kamera. Izinkan akses atau unggah foto.',
            );
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
        canvas.getContext('2d')?.drawImage(video, 0, 0);

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

    function onFile(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        setError(null);
        setPreview(URL.createObjectURL(file));
        onCapture(file);
    }

    function reset() {
        setPreview(null);
        onCapture(null);
    }

    return (
        <div className="space-y-3">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line bg-canvas">
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
                        className="size-full object-cover"
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
                    <>
                        <button
                            type="button"
                            onClick={startCamera}
                            disabled={disabled}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            <Camera className="size-4" />
                            Buka kamera
                        </button>
                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas">
                            <Upload className="size-4" />
                            Unggah foto
                            <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={onFile}
                                className="hidden"
                            />
                        </label>
                    </>
                )}
            </div>
        </div>
    );
}
