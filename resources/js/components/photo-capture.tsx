import { Camera, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type EmotionKey =
    | 'neutral'
    | 'happy'
    | 'sad'
    | 'angry'
    | 'fearful'
    | 'disgusted'
    | 'surprised';

export const EMOTION_INFO: Record<
    EmotionKey,
    { emoji: string; label: string; color: string }
> = {
    happy: { emoji: '😊', label: 'Senang', color: '#16a34a' },
    sad: { emoji: '😢', label: 'Sedih', color: '#2563eb' },
    angry: { emoji: '😠', label: 'Marah', color: '#dc2626' },
    fearful: { emoji: '😨', label: 'Takut', color: '#7c3aed' },
    disgusted: { emoji: '🤢', label: 'Jijik', color: '#ea580c' },
    surprised: { emoji: '😮', label: 'Kaget', color: '#ca8a04' },
    neutral: { emoji: '😐', label: 'Netral', color: '#4b5563' },
};

/** Minimal typing for the subset of face-api.js we use at runtime. */
interface FaceNet {
    loadFromUri(uri: string): Promise<void>;
}
interface FaceApiModule {
    nets: { tinyFaceDetector: FaceNet; faceExpressionNet: FaceNet };
    TinyFaceDetectorOptions: new (opts: { inputSize: number }) => unknown;
    detectSingleFace(
        input: HTMLVideoElement,
        options: unknown,
    ): {
        withFaceExpressions(): Promise<
            { expressions: Record<EmotionKey, number> } | undefined
        >;
    };
}

/** Loaded once per page lifecycle, reused across camera opens. */
let faceApiPromise: Promise<FaceApiModule> | null = null;

function loadFaceApi(): Promise<FaceApiModule> {
    if (!faceApiPromise) {
        // fetch() uses the document origin (Laravel), bypassing Vite's server.
        // createObjectURL → import(blobUrl) avoids Vite interception entirely.
        const importBlob = new Function('url', 'return import(url)') as (
            url: string,
        ) => Promise<FaceApiModule>;

        const origin = window.location.origin;

        faceApiPromise = fetch('/libs/face-api.esm.js')
            .then((r) => {
                if (!r.ok) {
                    throw new Error(`HTTP ${r.status}`);
                }

                return r.blob();
            })
            .then((blob) => {
                const blobUrl = URL.createObjectURL(blob);

                return importBlob(blobUrl);
            })
            .then(async (faceapi) => {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(
                        `${origin}/models`,
                    ),
                    faceapi.nets.faceExpressionNet.loadFromUri(
                        `${origin}/models`,
                    ),
                ]);

                return faceapi;
            });
    }

    return faceApiPromise;
}

function drawEmotionBadge(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    emotion: EmotionKey,
): void {
    const info = EMOTION_INFO[emotion];
    const text = `${info.emoji} ${info.label}`;
    const fontSize = Math.max(18, Math.round(canvasWidth * 0.042));
    const padH = Math.round(fontSize * 0.75);
    const padV = Math.round(fontSize * 0.5);
    const margin = Math.round(canvasWidth * 0.025);

    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textBaseline = 'middle';

    const tw = ctx.measureText(text).width;
    const bw = tw + padH * 2;
    const bh = fontSize + padV * 2;
    const x = canvasWidth - bw - margin;
    const y = margin;
    const r = bh / 2;

    // Pill background (semi-transparent)
    ctx.fillStyle = info.color + 'dd';
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + bw, y, x + bw, y + bh, r);
    ctx.arcTo(x + bw, y + bh, x, y + bh, r);
    ctx.arcTo(x, y + bh, x, y, r);
    ctx.arcTo(x, y, x + bw, y, r);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, x + padH, y + bh / 2);
}

export function PhotoCapture({
    onCapture,
    disabled = false,
}: {
    onCapture: (file: File | null, emotion?: EmotionKey | null) => void;
    disabled?: boolean;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const emotionRef = useRef<EmotionKey | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [detectedEmotion, setDetectedEmotion] = useState<EmotionKey | null>(
        null,
    );
    const [modelsLoading, setModelsLoading] = useState(false);

    // Attach stream to video element
    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
        }

        return () => {
            stream?.getTracks().forEach((t) => t.stop());
        };
    }, [stream]);

    // Start emotion detection while camera is live
    useEffect(() => {
        if (!stream) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDetectedEmotion(null);
            emotionRef.current = null;

            return;
        }

        setModelsLoading(true);
        let alive = true;

        loadFaceApi()
            .then((faceapi) => {
                if (!alive) {
                    return;
                }

                setModelsLoading(false);
                console.log('[emotion] face-api loaded, starting detection');

                intervalRef.current = setInterval(async () => {
                    const vid = videoRef.current;

                    if (!vid || !alive || vid.videoWidth === 0) {
                        console.log('[emotion] skip', {
                            hasVid: !!vid,
                            alive,
                            vw: vid?.videoWidth,
                        });

                        return;
                    }

                    try {
                        const result = await faceapi
                            .detectSingleFace(
                                vid,
                                new faceapi.TinyFaceDetectorOptions({
                                    inputSize: 224,
                                }),
                            )
                            .withFaceExpressions();

                        console.log('[emotion] result', result);

                        if (result && alive) {
                            const entries = Object.entries(
                                result.expressions,
                            ) as [EmotionKey, number][];
                            const dominant = entries.reduce((a, b) =>
                                a[1] >= b[1] ? a : b,
                            )[0];
                            setDetectedEmotion(dominant);
                            emotionRef.current = dominant;
                        }
                    } catch (e) {
                        console.error('[emotion] detect error', e);
                    }
                }, 600);
            })
            .catch((err: unknown) => {
                if (!alive) {
                    return;
                }

                setModelsLoading(false);
                const detail = err instanceof Error ? err.message : String(err);
                setError(`Gagal memuat detektor emosi: ${detail}`);
            });

        return () => {
            alive = false;

            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [stream]);

    function stopStream() {
        stream?.getTracks().forEach((t) => t.stop());
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

        if (!ctx) {
            return;
        }

        // Mirror horizontally to match the live preview
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0);

        // Reset transform before drawing the badge
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        const emotion = emotionRef.current;

        if (emotion) {
            drawEmotionBadge(ctx, canvas.width, emotion);
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
                onCapture(file, emotion);
                stopStream();
            },
            'image/jpeg',
            0.85,
        );
    }

    function reset() {
        setPreview(null);
        emotionRef.current = null;
        onCapture(null, null);
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
                    <>
                        <video
                            ref={videoRef}
                            playsInline
                            muted
                            className="size-full scale-x-[-1] object-cover"
                        />

                        {/* Live emotion badge overlay */}
                        {detectedEmotion && (
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-sm">
                                <span aria-hidden>
                                    {EMOTION_INFO[detectedEmotion].emoji}
                                </span>
                                <span>
                                    {EMOTION_INFO[detectedEmotion].label}
                                </span>
                            </div>
                        )}

                        {/* Model loading indicator */}
                        {modelsLoading && (
                            <div className="absolute bottom-2.5 left-2.5 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white/80">
                                Memuat detektor emosi…
                            </div>
                        )}
                    </>
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
