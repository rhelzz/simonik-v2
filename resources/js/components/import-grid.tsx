import { Plus, Trash2, Undo2 } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import type { Cell, Range } from '@/lib/grid';
import {
    emptyRow,
    fillDown,
    inRange,
    parsePaste,
    pasteAt,
    rangeOf,
    rangeToTsv,
} from '@/lib/grid';
import { cn } from '@/lib/utils';

/** Masalah per baris dari pratinjau; `line` mengikuti nomor baris di Excel. */
export type RowIssue = { line: number; type: string; message: string };

/**
 * Tabel isian ala Excel untuk halaman impor.
 *
 * Daftar gesturnya **tertutup** (lihat `docs/v2/06-FASE-6-HALAMAN-IMPOR.md`
 * §4.4): tempel banyak baris, isi-ke-bawah, salin rentang, undo satu tingkat,
 * navigasi keyboard, pilih rentang, tambah/hapus baris. Deret otomatis, rumus,
 * undo bertingkat, dan pengurutan sengaja tidak dibuat — permintaan gestur baru
 * harus masuk tabel itu dulu beserta biayanya.
 */
export function ImportGrid({
    headings,
    rows,
    onChange,
    issues,
    references,
}: {
    headings: string[];
    rows: string[][];
    onChange: (rows: string[][]) => void;
    issues: RowIssue[];
    references?: Record<string, string[]>;
}) {
    const width = headings.length;
    const [anchor, setAnchor] = useState<Cell | null>(null);
    const [focus, setFocus] = useState<Cell | null>(null);
    const [undo, setUndo] = useState<string[][] | null>(null);
    const [status, setStatus] = useState('');
    const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const range: Range | null = anchor && focus ? rangeOf(anchor, focus) : null;

    /** Masalah per baris tabel (baris 1 = judul kolom, jadi data mulai dari 2). */
    const issueByRow = new Map<number, RowIssue>();
    issues.forEach((issue) => {
        const index = issue.line - 2;

        // Galat menang atas peringatan: sel merah lebih mendesak dari kuning.
        const current = issueByRow.get(index);

        if (
            !current ||
            (current.type === 'warning' && issue.type !== 'warning')
        ) {
            issueByRow.set(index, issue);
        }
    });

    function commit(next: string[][], message: string) {
        setUndo(rows);
        onChange(next);
        setStatus(message);
    }

    function setCell(r: number, c: number, value: string) {
        const next = rows.map((row) => [...row]);
        next[r][c] = value;
        onChange(next);
    }

    function handlePaste(event: ClipboardEvent<HTMLInputElement>, at: Cell) {
        const text = event.clipboardData.getData('text/plain');

        if (!text.includes('\t') && !text.includes('\n')) {
            return; // tempelan satu sel: biarkan perilaku bawaan input
        }

        event.preventDefault();
        const data = parsePaste(text);
        commit(
            pasteAt(rows, at, data, width),
            `${data.length} baris ditempel.`,
        );
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>, at: Cell) {
        // Isi ke bawah — gestur yang paling sering dipakai untuk Kelas,
        // Jurusan, Industri, dan Status PKL yang sama sekelas.
        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'd'
        ) {
            event.preventDefault();

            if (range) {
                const filled = fillDown(rows, range);
                const count = (range.r2 - range.r1) * (range.c2 - range.c1 + 1);
                commit(filled, `${count} sel terisi.`);
            }

            return;
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'c'
        ) {
            if (range && (range.r1 !== range.r2 || range.c1 !== range.c2)) {
                event.preventDefault();
                void navigator.clipboard.writeText(rangeToTsv(rows, range));
                setStatus('Rentang disalin.');
            }

            return;
        }

        if (
            (event.ctrlKey || event.metaKey) &&
            event.key.toLowerCase() === 'z'
        ) {
            event.preventDefault();
            restore();

            return;
        }

        if (event.key.startsWith('Arrow') && event.shiftKey) {
            event.preventDefault();
            const delta = {
                ArrowUp: { r: -1, c: 0 },
                ArrowDown: { r: 1, c: 0 },
                ArrowLeft: { r: 0, c: -1 },
                ArrowRight: { r: 0, c: 1 },
            }[event.key];

            if (delta) {
                const next = {
                    r: Math.min(
                        Math.max((focus?.r ?? at.r) + delta.r, 0),
                        rows.length - 1,
                    ),
                    c: Math.min(
                        Math.max((focus?.c ?? at.c) + delta.c, 0),
                        width - 1,
                    ),
                };
                setFocus(next);
            }

            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            move(at.r + 1, at.c);
        }
    }

    function restore() {
        if (!undo) {
            setStatus('Tidak ada yang bisa dibatalkan.');

            return;
        }

        onChange(undo);
        setUndo(null);
        setStatus('Dibatalkan.');
    }

    function move(r: number, c: number) {
        cellRefs.current[`${r}:${c}`]?.focus();
    }

    function select(r: number, c: number, extend: boolean) {
        if (extend && anchor) {
            setFocus({ r, c });

            return;
        }

        setAnchor({ r, c });
        setFocus({ r, c });
    }

    function selectRow(r: number) {
        setAnchor({ r, c: 0 });
        setFocus({ r, c: width - 1 });
    }

    return (
        <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() =>
                        commit([...rows, emptyRow(width)], 'Baris ditambahkan.')
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                >
                    <Plus className="size-4" />
                    Baris
                </button>
                <button
                    type="button"
                    onClick={restore}
                    disabled={!undo}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas disabled:opacity-40"
                >
                    <Undo2 className="size-4" />
                    Batalkan
                </button>
                <p className="text-xs text-muted">
                    Tempel dari Excel dengan <Kbd>Ctrl</Kbd>+<Kbd>V</Kbd> · isi
                    ke bawah <Kbd>Ctrl</Kbd>+<Kbd>D</Kbd> · batalkan{' '}
                    <Kbd>Ctrl</Kbd>+<Kbd>Z</Kbd>
                </p>
                <p
                    role="status"
                    className="ml-auto text-xs font-medium text-muted"
                >
                    {status}
                </p>
            </div>

            <div className="max-h-[65vh] overflow-auto rounded-xl border border-line">
                <table className="w-full border-collapse text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-surface">
                        <tr className="bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
                            <th className="w-10 border-r border-line px-2 py-2 text-center">
                                #
                            </th>
                            {headings.map((heading) => (
                                <th
                                    key={heading}
                                    className="min-w-36 border-r border-line px-2 py-2 font-semibold whitespace-nowrap"
                                >
                                    {heading}
                                </th>
                            ))}
                            <th className="w-10 border-r border-line px-2 py-2" />
                            <th className="min-w-56 px-2 py-2 font-semibold">
                                Catatan
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                        {rows.map((row, r) => {
                            const issue = issueByRow.get(r);

                            return (
                                <tr
                                    key={r}
                                    className={cn(
                                        issue?.type === 'failed' &&
                                            'bg-red-50/60',
                                        issue?.type === 'skipped' &&
                                            'bg-canvas/60',
                                        issue?.type === 'warning' &&
                                            'bg-warning/10',
                                    )}
                                >
                                    <td className="border-r border-line px-2 py-1 text-center">
                                        <button
                                            type="button"
                                            onClick={() => selectRow(r)}
                                            aria-label={`Pilih baris ${r + 1}`}
                                            className="w-full text-xs text-muted transition-colors hover:text-ink"
                                        >
                                            {r + 1}
                                        </button>
                                    </td>
                                    {headings.map((heading, c) => {
                                        const listId = references?.[heading]
                                            ? `ref-${c}`
                                            : undefined;

                                        return (
                                            <td
                                                key={heading}
                                                className="border-r border-line p-0"
                                            >
                                                <input
                                                    ref={(node) => {
                                                        cellRefs.current[
                                                            `${r}:${c}`
                                                        ] = node;
                                                    }}
                                                    value={row[c] ?? ''}
                                                    list={listId}
                                                    aria-label={`${heading}, baris ${r + 1}`}
                                                    onChange={(event) =>
                                                        setCell(
                                                            r,
                                                            c,
                                                            event.target.value,
                                                        )
                                                    }
                                                    onFocus={() =>
                                                        select(r, c, false)
                                                    }
                                                    onMouseDown={(event) => {
                                                        if (event.shiftKey) {
                                                            event.preventDefault();
                                                            select(r, c, true);
                                                        }
                                                    }}
                                                    onPaste={(event) =>
                                                        handlePaste(event, {
                                                            r,
                                                            c,
                                                        })
                                                    }
                                                    onKeyDown={(event) =>
                                                        handleKeyDown(event, {
                                                            r,
                                                            c,
                                                        })
                                                    }
                                                    className={cn(
                                                        'w-full bg-transparent px-2 py-1.5 text-sm text-ink focus:bg-primary-soft/40 focus:outline-none',
                                                        range &&
                                                            inRange(
                                                                range,
                                                                r,
                                                                c,
                                                            ) &&
                                                            'bg-primary-soft/50',
                                                    )}
                                                />
                                            </td>
                                        );
                                    })}
                                    <td className="border-r border-line px-2 py-1 text-center">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                commit(
                                                    rows.filter(
                                                        (_, i) => i !== r,
                                                    ),
                                                    'Baris dihapus.',
                                                )
                                            }
                                            aria-label={`Hapus baris ${r + 1}`}
                                            className="grid size-7 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </td>
                                    <td className="px-2 py-1 text-xs">
                                        {issue ? (
                                            <span
                                                className={cn(
                                                    'font-medium',
                                                    issue.type === 'failed'
                                                        ? 'text-red-500'
                                                        : issue.type ===
                                                            'warning'
                                                          ? 'text-warning'
                                                          : 'text-muted',
                                                )}
                                            >
                                                {issue.message}
                                            </span>
                                        ) : (
                                            <span className="text-muted">
                                                —
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Saran nilai relasi langsung di dalam sel — fitur bawaan browser,
                dan pencegah galat impor terbesar per baris kode. */}
            {references &&
                headings.map((heading, c) =>
                    references[heading] ? (
                        <datalist key={heading} id={`ref-${c}`}>
                            {references[heading].map((value) => (
                                <option key={value} value={value} />
                            ))}
                        </datalist>
                    ) : null,
                )}
        </div>
    );
}

function Kbd({ children }: { children: React.ReactNode }) {
    return (
        <kbd className="rounded border border-line bg-canvas px-1 py-0.5 font-mono text-[0.65rem] text-ink">
            {children}
        </kbd>
    );
}
