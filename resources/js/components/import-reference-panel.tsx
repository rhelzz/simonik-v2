import { Check, ChevronDown, Copy, Search } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export type ReferenceGroups = Record<string, string[]>;

/**
 * Daftar nilai yang dikenali importer untuk kolom relasi.
 *
 * Ini penyebab galat impor nomor satu: kolom relasi diisi dengan **nama** lalu
 * di-resolve ke id, jadi salah satu huruf saja membuat nilainya dikosongkan —
 * dan operator bisa mengira impornya sukses padahal kolomnya kosong semua.
 * Di berkas template informasi ini ada di sheet terpisah, jadi operator harus
 * berpindah sheet sambil mengetik; di sini ia tinggal di samping tabel.
 */
export function ImportReferencePanel({
    references,
}: {
    references?: ReferenceGroups;
}) {
    if (!references) {
        return (
            <div className="space-y-2" aria-busy="true">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-11 animate-pulse rounded-xl bg-canvas"
                    />
                ))}
            </div>
        );
    }

    const groups = Object.entries(references);

    if (groups.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            {groups.map(([label, values]) => (
                <ReferenceGroup key={label} label={label} values={values} />
            ))}
        </div>
    );
}

function ReferenceGroup({
    label,
    values,
}: {
    label: string;
    values: string[];
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [copied, setCopied] = useState<string | null>(null);

    const shown = search.trim()
        ? values.filter((value) =>
              value.toLowerCase().includes(search.trim().toLowerCase()),
          )
        : values;

    async function copy(value: string) {
        await navigator.clipboard.writeText(value);
        setCopied(value);
        setTimeout(() => setCopied(null), 1200);
    }

    return (
        <div className="overflow-hidden rounded-xl border border-line">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 bg-canvas/40 px-3 py-2.5 text-left text-sm font-semibold text-ink transition-colors hover:bg-canvas"
            >
                <ChevronDown
                    className={cn(
                        'size-4 shrink-0 text-muted transition-transform',
                        open && 'rotate-180',
                    )}
                />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <span className="shrink-0 text-xs font-medium text-muted">
                    {values.length}
                </span>
            </button>

            {open && (
                <div className="space-y-2 p-3">
                    {values.length === 0 ? (
                        <p className="text-xs text-muted">
                            Belum ada data {label.toLowerCase()}. Impor atau
                            tambahkan lebih dulu agar kolom ini bisa diisi.
                        </p>
                    ) : (
                        <>
                            {values.length > 8 && (
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted" />
                                    <input
                                        type="search"
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder={`Cari ${label.toLowerCase()}…`}
                                        aria-label={`Cari ${label}`}
                                        className="w-full rounded-lg border border-line bg-canvas/40 py-1.5 pr-2 pl-8 text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none"
                                    />
                                </div>
                            )}
                            <ul className="max-h-56 space-y-0.5 overflow-y-auto">
                                {shown.map((value) => (
                                    <li key={value}>
                                        <button
                                            type="button"
                                            onClick={() => copy(value)}
                                            title="Salin"
                                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-ink transition-colors hover:bg-canvas"
                                        >
                                            <span className="min-w-0 flex-1 truncate">
                                                {value}
                                            </span>
                                            {copied === value ? (
                                                <Check className="size-3.5 shrink-0 text-positive" />
                                            ) : (
                                                <Copy className="size-3.5 shrink-0 text-muted" />
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
