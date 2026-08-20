import { router } from '@inertiajs/react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    reset as resetAction,
    resetPreview,
} from '@/actions/App/Http/Controllers/JournalMonitorController';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';

export type ResetOption = { id: number; name: string };

type Criteria = {
    departemen_id: string;
    class_id: string;
    industri_id: string;
    from: string;
    to: string;
};

const EMPTY: Criteria = {
    departemen_id: '',
    class_id: '',
    industri_id: '',
    from: '',
    to: '',
};

type Props = {
    open: boolean;
    onClose: () => void;
    departemens: ResetOption[];
    classOptions: ResetOption[];
    industryOptions: ResetOption[];
};

/**
 * Reset data jurnal — DESTRUKTIF dan tidak bisa dibatalkan.
 *
 * ponytail: salinan modal reset Data Absen dengan label & endpoint berbeda,
 * BUKAN komponen generik berparameter. Menggeneralisasikannya butuh >=6 prop
 * (judul, dua endpoint, kata benda, dua daftar opsi) demi menghemat JSX yang
 * tidak punya logika — dua berkas yang jujur lebih mudah dibaca. Gabungkan
 * kalau modul KETIGA butuh reset yang sama.
 *
 * Tiga lapis pengaman, semuanya wajib:
 *  1. Pratinjau jumlah baris dari SERVER (bukan tebakan di React) sebelum
 *     tombol aktif.
 *  2. Password akun yang sedang login (`current_password` di backend).
 *  3. Flash yang menyebut angka nyata, bukan "berhasil".
 */
export function ResetJournalModal({
    open,
    onClose,
    departemens,
    classOptions,
    industryOptions,
}: Props) {
    const [criteria, setCriteria] = useState<Criteria>(EMPTY);
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Hasil pratinjau disimpan BERSAMA kriteria yang menghasilkannya. Dengan
    // begitu "sedang menghitung" bisa diturunkan (result.key !== serialised)
    // alih-alih disimpan sebagai state yang di-set dari dalam effect — dan
    // angka basi tidak mungkin tampil sebagai angka yang berlaku.
    const [result, setResult] = useState<{
        key: string;
        count: number | null;
    } | null>(null);

    const payload = {
        departemen_id: criteria.departemen_id || null,
        class_id: criteria.class_id || null,
        industri_id: criteria.industri_id || null,
        from: criteria.from || null,
        to: criteria.to || null,
    };
    const serialised = JSON.stringify(payload);

    /**
     * Pratinjau dihitung ulang setiap kriteria berubah, dengan jeda singkat
     * supaya mengetik tanggal tidak memicu satu request per ketukan.
     */
    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = window.setTimeout(() => {
            fetch(resetPreview.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((row) => row.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: serialised,
            })
                .then((response) => response.json())
                .then((data: { count?: number }) =>
                    setResult({
                        key: serialised,
                        count:
                            typeof data.count === 'number' ? data.count : null,
                    }),
                )
                .catch(() => setResult({ key: serialised, count: null }));
        }, 300);

        return () => window.clearTimeout(timer);
    }, [open, serialised]);

    function submit(event: React.FormEvent) {
        event.preventDefault();
        setSubmitting(true);
        setError(null);

        router.delete(resetAction.url(), {
            data: { ...payload, password },
            preserveScroll: true,
            onSuccess: () => {
                setCriteria(EMPTY);
                setPassword('');
                setResult(null);
                onClose();
            },
            onError: (errors) =>
                setError(
                    errors.password ??
                        Object.values(errors)[0] ??
                        'Reset gagal. Periksa kembali kriteria dan password.',
                ),
            onFinish: () => setSubmitting(false),
        });
    }

    const options = (
        list: ResetOption[],
        placeholder: string,
    ): SelectOption[] => [
        { value: '', label: placeholder },
        ...list.map((item) => ({ value: String(item.id), label: item.name })),
    ];

    const fresh = result !== null && result.key === serialised;
    const count = fresh ? result.count : null;
    const counting = !fresh;

    const blocked =
        counting || count === null || count === 0 || password === '';

    return (
        <Modal open={open} onClose={onClose} title="Reset Data Jurnal">
            <form onSubmit={submit} className="space-y-4">
                <div className="flex gap-2.5 rounded-2xl bg-red-500/10 p-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                    <p className="text-xs text-ink">
                        Data jurnal yang dihapus{' '}
                        <strong>tidak bisa dikembalikan</strong>. Kriteria yang
                        diisi akan digabung (DAN). Kosongkan yang tidak dipakai
                        — mengosongkan semuanya berarti menghapus seluruh data
                        jurnal dalam cakupan Anda. Streak siswa akan kembali 0;
                        badge yang sudah diraih tetap.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Jurusan">
                        <Select
                            value={criteria.departemen_id}
                            options={options(departemens, 'Semua jurusan')}
                            onChange={(value) =>
                                setCriteria((c) => ({
                                    ...c,
                                    departemen_id: value,
                                }))
                            }
                            ariaLabel="Filter jurusan"
                        />
                    </Field>
                    <Field label="Kelas">
                        <Select
                            value={criteria.class_id}
                            options={options(classOptions, 'Semua kelas')}
                            onChange={(value) =>
                                setCriteria((c) => ({ ...c, class_id: value }))
                            }
                            ariaLabel="Filter kelas"
                        />
                    </Field>
                    <Field label="Industri">
                        <Select
                            value={criteria.industri_id}
                            options={options(industryOptions, 'Semua industri')}
                            onChange={(value) =>
                                setCriteria((c) => ({
                                    ...c,
                                    industri_id: value,
                                }))
                            }
                            ariaLabel="Filter industri"
                        />
                    </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Dari tanggal">
                        <input
                            type="date"
                            value={criteria.from}
                            onChange={(event) =>
                                setCriteria((c) => ({
                                    ...c,
                                    from: event.target.value,
                                }))
                            }
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Sampai tanggal">
                        <input
                            type="date"
                            value={criteria.to}
                            onChange={(event) =>
                                setCriteria((c) => ({
                                    ...c,
                                    to: event.target.value,
                                }))
                            }
                            className={inputClass}
                        />
                    </Field>
                </div>

                <div className="rounded-2xl bg-canvas p-3 text-center">
                    {counting ? (
                        <p className="text-sm text-muted">Menghitung…</p>
                    ) : count === null ? (
                        <p className="text-sm text-muted">
                            Pratinjau tidak tersedia.
                        </p>
                    ) : (
                        <p className="text-sm text-ink">
                            <strong className="text-lg font-extrabold">
                                {count}
                            </strong>{' '}
                            baris data jurnal akan dihapus permanen.
                        </p>
                    )}
                </div>

                <Field label="Password akun Anda">
                    <input
                        type="password"
                        value={password}
                        autoComplete="current-password"
                        onChange={(event) => setPassword(event.target.value)}
                        className={inputClass}
                    />
                    {error && (
                        <span className="mt-1 block text-xs font-medium text-red-500">
                            {error}
                        </span>
                    )}
                </Field>

                <div className="flex justify-end gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
                    >
                        Batal
                    </button>
                    <button
                        type="submit"
                        disabled={blocked || submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:opacity-50"
                    >
                        <Trash2 className="size-4" />
                        Reset permanen
                    </button>
                </div>
            </form>
        </Modal>
    );
}

const inputClass =
    'w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none';

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1 block text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
            </span>
            {children}
        </label>
    );
}
