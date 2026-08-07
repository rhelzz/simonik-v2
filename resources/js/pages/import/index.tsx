import { Deferred, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Download,
    FileSpreadsheet,
    LoaderCircle,
    Upload,
} from 'lucide-react';
import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ImportGrid } from '@/components/import-grid';
import type { RowIssue } from '@/components/import-grid';
import { ImportReferencePanel } from '@/components/import-reference-panel';
import type { ReferenceGroups } from '@/components/import-reference-panel';
import { AppLayout } from '@/layouts/app-layout';
import { emptyRow, withoutBlankRows } from '@/lib/grid';

type Instruction = [string, string, string];

type ImportPageProps = {
    title: string;
    sheet: string;
    headings: string[];
    instructions: Instruction[];
    example: string[];
    note: string;
    templateUrl: string;
    previewUrl: string;
    storeUrl: string;
    backUrl: string;
    references?: ReferenceGroups;
};

const BLANK_ROWS = 5;

export default function ImportPage({
    title,
    sheet,
    headings,
    instructions,
    example,
    note,
    templateUrl,
    previewUrl,
    storeUrl,
    backUrl,
    references,
}: ImportPageProps) {
    const [rows, setRows] = useState<string[][]>(
        Array.from({ length: BLANK_ROWS }, () => emptyRow(headings.length)),
    );
    const [issues, setIssues] = useState<RowIssue[]>([]);
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);
    const [checked, setChecked] = useState(false);
    const [error, setError] = useState('');

    const filled = withoutBlankRows(rows);
    const failedCount = issues.filter(
        (issue) => issue.type === 'failed',
    ).length;
    const warningCount = issues.filter(
        (issue) => issue.type === 'warning',
    ).length;
    const skippedCount = issues.filter(
        (issue) => issue.type === 'skipped',
    ).length;
    const savable = filled.length - failedCount - skippedCount;

    function update(next: string[][]) {
        setRows(next);
        // Pratinjau lama tidak lagi berlaku begitu isinya berubah — menandai
        // sel dengan hasil validasi yang basi lebih menyesatkan daripada
        // tidak menandai sama sekali.
        setIssues([]);
        setChecked(false);
        setError('');
    }

    async function check() {
        setChecking(true);

        try {
            const response = await fetch(previewUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie
                            .split('; ')
                            .find((part) => part.startsWith('XSRF-TOKEN='))
                            ?.split('=')[1] ?? '',
                    ),
                },
                body: JSON.stringify({ rows: filled }),
            });

            if (!response.ok) {
                const problem = await response.json();
                setIssues([]);
                setChecked(false);
                setError(
                    problem.message ??
                        'Gagal memeriksa data. Coba kurangi jumlah barisnya.',
                );

                return;
            }

            const data = await response.json();
            setIssues(data.issues ?? []);
            setError('');
            setChecked(true);
        } finally {
            setChecking(false);
        }
    }

    function save() {
        setSaving(true);
        router.post(
            storeUrl,
            { rows: filled },
            {
                onFinish: () => setSaving(false),
            },
        );
    }

    function upload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const form = new FormData();
        form.append('file', file);
        router.post(storeUrl, form, { forceFormData: true });
    }

    return (
        <AppLayout title={title}>
            <div className="space-y-5">
                <Link
                    href={backUrl}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
                >
                    <ArrowLeft className="size-4" />
                    Kembali
                </Link>

                <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
                    <section className="space-y-4 rounded-3xl bg-surface p-5 sm:p-6">
                        <div>
                            <h2 className="text-base font-bold text-ink">
                                Isi data di sini
                            </h2>
                            <p className="text-sm text-muted">
                                Salin dari Excel lalu tempel, atau ketik
                                langsung. Periksa dulu sebelum menyimpan — tidak
                                ada yang tersimpan sampai Anda menekan Simpan.
                            </p>
                        </div>

                        <ImportGrid
                            headings={headings}
                            rows={rows}
                            onChange={update}
                            issues={issues}
                            references={references}
                        />

                        {error && (
                            <p className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                {error}
                            </p>
                        )}

                        {checked && (
                            <div
                                role="status"
                                className="space-y-1 rounded-2xl border border-line bg-canvas/40 p-4 text-sm"
                            >
                                <p className="flex items-center gap-2 font-semibold text-ink">
                                    {failedCount === 0 ? (
                                        <CheckCircle2 className="size-4 text-positive" />
                                    ) : (
                                        <AlertCircle className="size-4 text-red-500" />
                                    )}
                                    {savable} baris siap disimpan
                                    {failedCount > 0 &&
                                        ` · ${failedCount} gagal`}
                                    {skippedCount > 0 &&
                                        ` · ${skippedCount} sudah terdaftar`}
                                </p>
                                {warningCount > 0 && (
                                    <p className="text-warning">
                                        {warningCount} nilai relasi tidak
                                        dikenali dan akan dikosongkan — periksa
                                        kolom bertanda kuning.
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={check}
                                disabled={checking || filled.length === 0}
                                className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-50"
                            >
                                {checking && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Periksa
                            </button>
                            <button
                                type="button"
                                onClick={save}
                                disabled={saving || filled.length === 0}
                                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                            >
                                {saving && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Simpan {filled.length} baris
                            </button>
                        </div>
                    </section>

                    <aside className="space-y-5">
                        <section className="space-y-3 rounded-3xl bg-surface p-5">
                            <h3 className="text-sm font-bold text-ink">
                                Nilai referensi
                            </h3>
                            <p className="text-xs text-muted">
                                Kolom relasi harus persis sama dengan salah satu
                                nilai ini. Klik untuk menyalin.
                            </p>
                            <Deferred
                                data="references"
                                fallback={<ImportReferencePanel />}
                            >
                                <ImportReferencePanel references={references} />
                            </Deferred>
                        </section>

                        <section className="space-y-3 rounded-3xl bg-surface p-5">
                            <h3 className="text-sm font-bold text-ink">
                                Cara mengisi
                            </h3>
                            <dl className="space-y-2 text-xs">
                                {instructions.map(([column, required, how]) => (
                                    <div key={column}>
                                        <dt className="font-semibold text-ink">
                                            {column}{' '}
                                            <span
                                                className={
                                                    required === 'Wajib'
                                                        ? 'text-red-500'
                                                        : 'text-muted'
                                                }
                                            >
                                                ({required.toLowerCase()})
                                            </span>
                                        </dt>
                                        <dd className="text-muted">{how}</dd>
                                    </div>
                                ))}
                            </dl>
                            <div className="rounded-xl bg-canvas/60 p-3 text-xs text-muted">
                                <p className="font-semibold text-ink">
                                    Contoh satu baris
                                </p>
                                <p className="mt-1 break-words">
                                    {example.filter(Boolean).join(' | ')}
                                </p>
                            </div>
                            <p className="text-xs text-muted">{note}</p>
                        </section>

                        <section className="space-y-3 rounded-3xl bg-surface p-5">
                            <h3 className="text-sm font-bold text-ink">
                                Lewat berkas Excel
                            </h3>
                            <a
                                href={templateUrl}
                                className="flex items-center gap-3 rounded-2xl border border-line bg-canvas/40 p-3 transition-colors hover:border-primary/40"
                            >
                                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-positive/15 text-positive">
                                    <FileSpreadsheet className="size-5" />
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-ink">
                                        Unduh template
                                    </span>
                                    <span className="block text-xs text-muted">
                                        Isi sheet &ldquo;{sheet}&rdquo;.
                                    </span>
                                </span>
                                <Download className="ml-auto size-4 shrink-0 text-muted" />
                            </a>
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-4 py-3 text-sm font-medium text-ink transition-colors hover:bg-canvas">
                                <Upload className="size-4 text-muted" />
                                Unggah berkas terisi
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={upload}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-muted">
                                Unggahan langsung disimpan tanpa pratinjau.
                            </p>
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
