import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle, Upload } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { index } from '@/actions/App/Http/Controllers/CertificateTemplateController';
import { CertificatePreview } from '@/components/certificates/certificate-preview';

type Align = 'left' | 'center' | 'right';

export type Anchor = {
    field: string;
    x: number;
    y: number;
    size: number;
    align: Align;
    color: string;
    enabled: boolean;
};

export type TemplateDefaults = {
    id: number;
    name: string;
    background: string | null;
    anchors: Anchor[];
};

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

const defaultAnchor = (field: string, index: number): Anchor => ({
    field,
    x: 50,
    y: 40 + index * 8,
    size: field === 'nama' ? 6 : 3,
    align: 'center',
    color: '#1f2937',
    enabled: field !== 'nis',
});

const inputClass =
    'w-full rounded-lg border border-line bg-canvas/40 px-2.5 py-1.5 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

export function CertificateTemplateForm({
    action,
    method,
    fields,
    template,
    submitLabel,
}: {
    action: string;
    method: 'post' | 'put';
    fields: string[];
    template?: TemplateDefaults;
    submitLabel: string;
}) {
    const [anchors, setAnchors] = useState<Anchor[]>(() =>
        fields.map((field, index) => {
            const existing = template?.anchors.find((a) => a.field === field);

            return existing ?? defaultAnchor(field, index);
        }),
    );
    const [preview, setPreview] = useState<string | null>(
        template?.background ?? null,
    );

    const form = useForm<{ name: string; background: File | null }>({
        name: template?.name ?? '',
        background: null,
    });

    function setAnchor(field: string, patch: Partial<Anchor>) {
        setAnchors((current) =>
            current.map((anchor) =>
                anchor.field === field ? { ...anchor, ...patch } : anchor,
            ),
        );
    }

    function onFile(file: File | null) {
        form.setData('background', file);
        setPreview(
            file ? URL.createObjectURL(file) : (template?.background ?? null),
        );
    }

    function submit(event: FormEvent) {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            anchors: JSON.stringify(anchors),
            ...(method === 'put' ? { _method: 'put' } : {}),
        }));

        form.post(action, { forceFormData: true });
    }

    const previewItems = anchors
        .filter((anchor) => anchor.enabled)
        .map((anchor) => ({
            text: sampleValues[anchor.field] ?? anchor.field,
            x: anchor.x,
            y: anchor.y,
            size: anchor.size,
            align: anchor.align,
            color: anchor.color,
        }));

    return (
        <form onSubmit={submit} className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
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

                    <div className="mt-4 space-y-1.5">
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
                                    onFile(event.target.files?.[0] ?? null)
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

                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-ink">Anchor teks</h3>
                    <p className="text-xs text-muted">
                        Posisi X/Y dalam persen; ukuran dalam persen lebar.
                    </p>

                    <div className="mt-3 space-y-3">
                        {anchors.map((anchor) => (
                            <div
                                key={anchor.field}
                                className="rounded-2xl border border-line p-3"
                            >
                                <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                                    <input
                                        type="checkbox"
                                        checked={anchor.enabled}
                                        onChange={(event) =>
                                            setAnchor(anchor.field, {
                                                enabled: event.target.checked,
                                            })
                                        }
                                        className="size-4 rounded border-line text-primary focus:ring-primary/30"
                                    />
                                    {fieldLabels[anchor.field] ?? anchor.field}
                                </label>

                                {anchor.enabled && (
                                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                                        <Cell label="X %">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={anchor.x}
                                                onChange={(event) =>
                                                    setAnchor(anchor.field, {
                                                        x: Number(
                                                            event.target.value,
                                                        ),
                                                    })
                                                }
                                                className={inputClass}
                                            />
                                        </Cell>
                                        <Cell label="Y %">
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={anchor.y}
                                                onChange={(event) =>
                                                    setAnchor(anchor.field, {
                                                        y: Number(
                                                            event.target.value,
                                                        ),
                                                    })
                                                }
                                                className={inputClass}
                                            />
                                        </Cell>
                                        <Cell label="Ukuran">
                                            <input
                                                type="number"
                                                min={1}
                                                max={100}
                                                value={anchor.size}
                                                onChange={(event) =>
                                                    setAnchor(anchor.field, {
                                                        size: Number(
                                                            event.target.value,
                                                        ),
                                                    })
                                                }
                                                className={inputClass}
                                            />
                                        </Cell>
                                        <Cell label="Rata">
                                            <select
                                                value={anchor.align}
                                                onChange={(event) =>
                                                    setAnchor(anchor.field, {
                                                        align: event.target
                                                            .value as Align,
                                                    })
                                                }
                                                className={inputClass}
                                            >
                                                <option value="left">
                                                    Kiri
                                                </option>
                                                <option value="center">
                                                    Tengah
                                                </option>
                                                <option value="right">
                                                    Kanan
                                                </option>
                                            </select>
                                        </Cell>
                                        <Cell label="Warna">
                                            <input
                                                type="color"
                                                value={anchor.color}
                                                onChange={(event) =>
                                                    setAnchor(anchor.field, {
                                                        color: event.target
                                                            .value,
                                                    })
                                                }
                                                className="h-8 w-full rounded-lg border border-line"
                                            />
                                        </Cell>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="space-y-4">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-sm font-bold text-ink">
                        Pratinjau (data contoh)
                    </h3>
                    <div className="mt-3">
                        <CertificatePreview
                            background={preview}
                            items={previewItems}
                        />
                    </div>
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

function Cell({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1">
            <span className="text-[11px] font-medium text-muted">{label}</span>
            {children}
        </div>
    );
}
