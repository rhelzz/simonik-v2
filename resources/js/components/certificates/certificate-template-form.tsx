import { Link, useForm } from '@inertiajs/react';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    ImageOff,
    LoaderCircle,
    Move,
    MoveHorizontal,
    MoveVertical,
    PenLine,
    Trash2,
    Upload,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, PointerEvent as ReactPointerEvent } from 'react';
import { index } from '@/actions/App/Http/Controllers/CertificateTemplateController';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

type Align = 'left' | 'center' | 'right';

export type Anchor = {
    field: string;
    x: number;
    y: number;
    size: number;
    align: Align;
    color: string;
    font: string;
    enabled: boolean;
};

export type SignaturePos = { x: number; y: number; width: number };

export type TemplateDefaults = {
    id: number;
    name: string;
    background: string | null;
    anchors: Anchor[];
    signatureUrl: string | null;
    signaturePos: SignaturePos | null;
};

const SIGNATURE = '__signature__';

const fieldLabels: Record<string, string> = {
    nama: 'Nama siswa',
    nis: 'NIS',
    nomor: 'Nomor sertifikat',
    industri: 'Industri / DUDI',
    tanggal: 'Tanggal terbit',
};

const sampleValues: Record<string, string> = {
    nama: 'Nama Siswa',
    nis: '0012345678',
    nomor: 'PKL/2026/0001',
    industri: 'PT Contoh Industri',
    tanggal: '01 Juni 2026',
};

const defaultSignaturePos: SignaturePos = { x: 72, y: 82, width: 18 };

const defaultAnchor = (field: string, index: number): Anchor => ({
    field,
    x: 50,
    y: 40 + index * 8,
    size: field === 'nama' ? 6 : 3,
    align: 'center',
    color: '#1f2937',
    font: field === 'nama' ? 'Playfair Display' : 'Poppins',
    enabled: field !== 'nis',
});

const clamp = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

const alignOptions: { value: Align; icon: typeof AlignLeft; label: string }[] =
    [
        { value: 'left', icon: AlignLeft, label: 'Kiri' },
        { value: 'center', icon: AlignCenter, label: 'Tengah' },
        { value: 'right', icon: AlignRight, label: 'Kanan' },
    ];

/** Tombol bantu memusatkan posisi elemen secara horizontal / vertikal. */
function CenterButtons({
    onCenterX,
    onCenterY,
}: {
    onCenterX: () => void;
    onCenterY: () => void;
}) {
    const base =
        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line bg-canvas/40 px-2 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary';

    return (
        <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted">
                Pusatkan posisi
            </span>
            <div className="flex gap-2">
                <button type="button" onClick={onCenterX} className={base}>
                    <MoveHorizontal className="size-3.5" />
                    Tengah X
                </button>
                <button type="button" onClick={onCenterY} className={base}>
                    <MoveVertical className="size-3.5" />
                    Tengah Y
                </button>
            </div>
        </div>
    );
}

export function CertificateTemplateForm({
    action,
    method,
    fields,
    fonts,
    template,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    fields: string[];
    fonts: string[];
    template?: TemplateDefaults;
    submitLabel: string;
}) {
    const [anchors, setAnchors] = useState<Anchor[]>(() =>
        fields.map((field, index) => {
            const existing = template?.anchors.find((a) => a.field === field);

            return existing
                ? { ...defaultAnchor(field, index), ...existing }
                : defaultAnchor(field, index);
        }),
    );
    const [bgPreview, setBgPreview] = useState<string | null>(
        template?.background ?? null,
    );
    const [sigPreview, setSigPreview] = useState<string | null>(
        template?.signatureUrl ?? null,
    );
    const [sigPos, setSigPos] = useState<SignaturePos>(
        template?.signaturePos ?? defaultSignaturePos,
    );
    const [removeSignature, setRemoveSignature] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const canvasRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<string | null>(null);

    const form = useForm<{
        name: string;
        background: File | null;
        signature: File | null;
    }>({
        name: template?.name ?? '',
        background: null,
        signature: null,
    });

    const fontOptions = fonts.map((f) => ({
        value: f,
        label: f,
        hint: (
            <span style={{ fontFamily: `'${f}', serif` }} className="text-base">
                Aa
            </span>
        ),
    }));

    function setAnchor(field: string, patch: Partial<Anchor>) {
        setAnchors((current) =>
            current.map((anchor) =>
                anchor.field === field ? { ...anchor, ...patch } : anchor,
            ),
        );
    }

    // Seret teks/TTD langsung pada pratinjau untuk mengatur posisi.
    useEffect(() => {
        if (!dragging) {
            return;
        }

        function move(event: PointerEvent) {
            const canvas = canvasRef.current;
            const target = dragRef.current;

            if (!canvas || !target) {
                return;
            }

            const rect = canvas.getBoundingClientRect();
            const x = clamp(
                ((event.clientX - rect.left) / rect.width) * 100,
                0,
                100,
            );
            const y = clamp(
                ((event.clientY - rect.top) / rect.height) * 100,
                0,
                100,
            );

            if (target === SIGNATURE) {
                setSigPos((pos) => ({
                    ...pos,
                    x: Math.round(x),
                    y: Math.round(y),
                }));
            } else {
                setAnchor(target, { x: Math.round(x), y: Math.round(y) });
            }
        }

        function up() {
            setDragging(false);
            dragRef.current = null;
        }

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);

        return () => {
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', up);
        };
    }, [dragging]);

    function startDrag(target: string, event: ReactPointerEvent) {
        event.preventDefault();
        setSelected(target);
        dragRef.current = target;
        setDragging(true);
    }

    function onBackground(file: File | null) {
        form.setData('background', file);
        setBgPreview(
            file ? URL.createObjectURL(file) : (template?.background ?? null),
        );
    }

    function onSignature(file: File | null) {
        if (!file) {
            return;
        }

        form.setData('signature', file);
        setSigPreview(URL.createObjectURL(file));
        setRemoveSignature(false);
        setSelected(SIGNATURE);
    }

    function clearSignature() {
        form.setData('signature', null);
        setSigPreview(null);
        setRemoveSignature(true);

        if (selected === SIGNATURE) {
            setSelected(null);
        }
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            anchors: JSON.stringify(anchors),
            signaturePos: sigPreview ? JSON.stringify(sigPos) : '',
            removeSignature: removeSignature ? '1' : '',
            ...(method === 'put' ? { _method: 'put' } : {}),
        }));

        form.post(action, { forceFormData: true });
    }

    const selectedAnchor =
        selected && selected !== SIGNATURE
            ? anchors.find((a) => a.field === selected)
            : undefined;

    return (
        <form onSubmit={submit} className="grid gap-5 lg:grid-cols-5">
            {/* Kanvas editor interaktif */}
            <div className="space-y-4 lg:col-span-3">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                        <Move className="size-4 text-primary" />
                        <h3 className="text-sm font-bold text-ink">
                            Susun sertifikat
                        </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                        Seret teks & tanda tangan langsung pada pratinjau untuk
                        mengatur posisinya. Ketuk elemen untuk mengubah gaya.
                    </p>

                    <div className="@container mt-4">
                        {bgPreview ? (
                            <div
                                ref={canvasRef}
                                className="relative w-full touch-none overflow-hidden rounded-xl border border-line select-none"
                            >
                                <img
                                    src={bgPreview}
                                    alt="Latar sertifikat"
                                    className="pointer-events-none block w-full"
                                />

                                {anchors
                                    .filter((anchor) => anchor.enabled)
                                    .map((anchor) => (
                                        <span
                                            key={anchor.field}
                                            onPointerDown={(event) =>
                                                startDrag(anchor.field, event)
                                            }
                                            className={cn(
                                                'absolute cursor-move leading-tight font-semibold whitespace-nowrap outline-2 outline-offset-2 transition-[outline-color]',
                                                selected === anchor.field
                                                    ? 'outline-primary'
                                                    : 'outline-transparent hover:outline-primary/40',
                                            )}
                                            style={{
                                                left: `${anchor.x}%`,
                                                top: `${anchor.y}%`,
                                                transform: `translate(${
                                                    anchor.align === 'center'
                                                        ? '-50%'
                                                        : anchor.align ===
                                                            'right'
                                                          ? '-100%'
                                                          : '0'
                                                }, -50%)`,
                                                fontSize: `${anchor.size}cqw`,
                                                color: anchor.color,
                                                textAlign: anchor.align,
                                                fontFamily: `'${anchor.font}', serif`,
                                            }}
                                        >
                                            {sampleValues[anchor.field] ??
                                                anchor.field}
                                        </span>
                                    ))}

                                {sigPreview && (
                                    <img
                                        src={sigPreview}
                                        alt="Tanda tangan"
                                        onPointerDown={(event) =>
                                            startDrag(SIGNATURE, event)
                                        }
                                        className={cn(
                                            'absolute -translate-x-1/2 -translate-y-1/2 cursor-move object-contain outline-2 outline-offset-2 transition-[outline-color]',
                                            selected === SIGNATURE
                                                ? 'outline-primary'
                                                : 'outline-transparent hover:outline-primary/40',
                                        )}
                                        style={{
                                            left: `${sigPos.x}%`,
                                            top: `${sigPos.y}%`,
                                            width: `${sigPos.width}%`,
                                        }}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className="grid aspect-[1.414/1] w-full place-items-center rounded-xl border border-dashed border-line bg-canvas text-muted">
                                <div className="flex flex-col items-center gap-1">
                                    <ImageOff className="size-7" />
                                    <p className="text-sm">
                                        Unggah gambar latar untuk mulai menyusun
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Panel pengaturan */}
            <div className="space-y-4 lg:col-span-2">
                <section className="space-y-4 rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="name"
                            className="text-sm font-medium text-ink"
                        >
                            Nama template
                        </label>
                        <input
                            id="name"
                            value={form.data.name}
                            onChange={(event) =>
                                form.setData('name', event.target.value)
                            }
                            placeholder="mis. Sertifikat PKL 2026"
                            className="w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            required
                        />
                        {form.errors.name && (
                            <p className="text-xs font-medium text-red-500">
                                {form.errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <span className="text-sm font-medium text-ink">
                            Gambar latar (JPG/PNG, rasio mendatar)
                        </span>
                        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas">
                            <Upload className="size-4 text-muted" />
                            {form.data.background
                                ? form.data.background.name
                                : template
                                  ? 'Ganti gambar latar (opsional)'
                                  : 'Pilih gambar latar'}
                            <input
                                type="file"
                                accept="image/png,image/jpeg"
                                onChange={(event) =>
                                    onBackground(
                                        event.target.files?.[0] ?? null,
                                    )
                                }
                                className="hidden"
                            />
                        </label>
                        {form.errors.background && (
                            <p className="text-xs font-medium text-red-500">
                                {form.errors.background}
                            </p>
                        )}
                    </div>
                </section>

                {/* Field yang ditampilkan */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-ink">
                        Isi sertifikat
                    </h3>
                    <p className="text-xs text-muted">
                        Ketuk untuk menampilkan & menata; ketuk lagi yang aktif
                        untuk menyembunyikan.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {anchors.map((anchor) => (
                            <button
                                key={anchor.field}
                                type="button"
                                onClick={() => {
                                    // Aktif & sedang terpilih -> ketuk lagi untuk sembunyikan.
                                    if (
                                        anchor.enabled &&
                                        selected === anchor.field
                                    ) {
                                        setAnchor(anchor.field, {
                                            enabled: false,
                                        });
                                        setSelected(null);

                                        return;
                                    }

                                    if (!anchor.enabled) {
                                        setAnchor(anchor.field, {
                                            enabled: true,
                                        });
                                    }

                                    setSelected(anchor.field);
                                }}
                                className={cn(
                                    'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                                    !anchor.enabled
                                        ? 'border-dashed border-line text-muted hover:border-primary/40 hover:text-ink'
                                        : selected === anchor.field
                                          ? 'border-primary bg-primary-soft text-primary'
                                          : 'border-line bg-canvas/40 text-ink hover:border-primary/40',
                                )}
                            >
                                {fieldLabels[anchor.field] ?? anchor.field}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Editor properti elemen terpilih */}
                {selectedAnchor && (
                    <section className="space-y-4 rounded-3xl bg-surface p-5 sm:p-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-ink">
                                {fieldLabels[selectedAnchor.field] ??
                                    selectedAnchor.field}
                            </h3>
                            <button
                                type="button"
                                onClick={() => {
                                    setAnchor(selectedAnchor.field, {
                                        enabled: false,
                                    });
                                    setSelected(null);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                            >
                                <Trash2 className="size-3.5" />
                                Sembunyikan
                            </button>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted">
                                Font
                            </span>
                            <Select
                                value={selectedAnchor.font}
                                options={fontOptions}
                                onChange={(value) =>
                                    setAnchor(selectedAnchor.field, {
                                        font: value,
                                    })
                                }
                                ariaLabel="Pilih font"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <span className="text-xs font-medium text-muted">
                                    Ukuran ({selectedAnchor.size})
                                </span>
                                <input
                                    type="range"
                                    min={1}
                                    max={16}
                                    step={0.5}
                                    value={selectedAnchor.size}
                                    onChange={(event) =>
                                        setAnchor(selectedAnchor.field, {
                                            size: Number(event.target.value),
                                        })
                                    }
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-xs font-medium text-muted">
                                    Warna
                                </span>
                                <input
                                    type="color"
                                    value={selectedAnchor.color}
                                    onChange={(event) =>
                                        setAnchor(selectedAnchor.field, {
                                            color: event.target.value,
                                        })
                                    }
                                    className="h-9 w-full rounded-lg border border-line"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <span className="text-xs font-medium text-muted">
                                Perataan
                            </span>
                            <div className="flex gap-1 rounded-xl bg-canvas p-1">
                                {alignOptions.map((option) => {
                                    const Icon = option.icon;

                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() =>
                                                setAnchor(
                                                    selectedAnchor.field,
                                                    {
                                                        align: option.value,
                                                    },
                                                )
                                            }
                                            aria-label={option.label}
                                            className={cn(
                                                'flex flex-1 items-center justify-center rounded-lg py-1.5 transition-colors',
                                                selectedAnchor.align ===
                                                    option.value
                                                    ? 'bg-surface text-primary shadow-sm'
                                                    : 'text-muted hover:text-ink',
                                            )}
                                        >
                                            <Icon className="size-4" />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <CenterButtons
                            onCenterX={() =>
                                setAnchor(selectedAnchor.field, { x: 50 })
                            }
                            onCenterY={() =>
                                setAnchor(selectedAnchor.field, { y: 50 })
                            }
                        />
                    </section>
                )}

                {/* Tanda tangan digital */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                        <PenLine className="size-4 text-primary" />
                        <h3 className="text-sm font-bold text-ink">
                            Tanda tangan digital
                        </h3>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                        Unggah TTD (PNG transparan disarankan), lalu seret pada
                        pratinjau.
                    </p>

                    <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas">
                        <Upload className="size-4 text-muted" />
                        {sigPreview
                            ? 'Ganti tanda tangan'
                            : 'Unggah tanda tangan'}
                        <input
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(event) =>
                                onSignature(event.target.files?.[0] ?? null)
                            }
                            className="hidden"
                        />
                    </label>
                    {form.errors.signature && (
                        <p className="mt-1 text-xs font-medium text-red-500">
                            {form.errors.signature}
                        </p>
                    )}

                    {sigPreview && (
                        <div className="mt-3 space-y-1.5">
                            <span className="text-xs font-medium text-muted">
                                Lebar ({sigPos.width}%)
                            </span>
                            <input
                                type="range"
                                min={5}
                                max={50}
                                value={sigPos.width}
                                onChange={(event) =>
                                    setSigPos((pos) => ({
                                        ...pos,
                                        width: Number(event.target.value),
                                    }))
                                }
                                className="w-full accent-primary"
                            />

                            <CenterButtons
                                onCenterX={() =>
                                    setSigPos((pos) => ({ ...pos, x: 50 }))
                                }
                                onCenterY={() =>
                                    setSigPos((pos) => ({ ...pos, y: 50 }))
                                }
                            />

                            <button
                                type="button"
                                onClick={clearSignature}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-muted transition-colors hover:text-red-500"
                            >
                                <Trash2 className="size-3.5" />
                                Hapus tanda tangan
                            </button>
                        </div>
                    )}
                </section>

                <div className="flex items-center justify-end gap-2">
                    <Link
                        href={index.url()}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-surface"
                    >
                        Batal
                    </Link>
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                    >
                        {form.processing && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}
                        {submitLabel}
                    </button>
                </div>
            </div>
        </form>
    );
}
