import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Cerminan App\Support\TagName::normalise() untuk pratinjau di layar. */
export function normaliseTag(raw: string): string {
    return raw
        .replace(/^#+/, '')
        .toLowerCase()
        .replace(/[^a-z0-9\-_\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 30);
}

/**
 * Masukan tag berbentuk chip.
 *
 * Tag TIDAK diambil dari badan tulisan (ala Twitter): "#1" dan potongan kode
 * akan ikut jadi tag tanpa disengaja, dan memperbaiki typo di isi tulisan akan
 * memindahkan diskusi ke kelompok lain tanpa disadari penulisnya.
 *
 * Normalisasi di sini hanya untuk pratinjau — yang mengikat tetap server.
 */
export function TagInput({
    value,
    onChange,
    suggested,
    max = 5,
    error,
}: {
    value: string[];
    onChange: (tags: string[]) => void;
    suggested: string[];
    max?: number;
    error?: string;
}) {
    const [draft, setDraft] = useState('');
    const full = value.length >= max;

    function add(raw: string) {
        const tag = normaliseTag(raw);

        if (tag === '' || value.includes(tag) || full) {
            setDraft('');

            return;
        }

        onChange([...value, tag]);
        setDraft('');
    }

    function remove(tag: string) {
        onChange(value.filter((item) => item !== tag));
    }

    return (
        <div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-canvas p-2">
                {value.map((tag) => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"
                    >
                        #{tag}
                        <button
                            type="button"
                            onClick={() => remove(tag)}
                            aria-label={`Hapus tag ${tag}`}
                            className="grid size-4 place-items-center rounded-full hover:bg-primary/15"
                        >
                            <X className="size-3" />
                        </button>
                    </span>
                ))}

                <input
                    type="text"
                    value={draft}
                    disabled={full}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                        if (
                            event.key === 'Enter' ||
                            event.key === ',' ||
                            event.key === ' '
                        ) {
                            event.preventDefault();
                            add(draft);
                        }

                        if (
                            event.key === 'Backspace' &&
                            draft === '' &&
                            value.length > 0
                        ) {
                            remove(value[value.length - 1]);
                        }
                    }}
                    onBlur={() => add(draft)}
                    placeholder={
                        full
                            ? `Maksimal ${max} tag`
                            : 'Ketik tag lalu Enter, mis. absen'
                    }
                    className="min-w-40 flex-1 bg-transparent px-1 py-1 text-sm text-ink placeholder:text-muted focus:outline-none disabled:cursor-not-allowed"
                />
            </div>

            {error && (
                <span className="mt-1 block text-xs font-medium text-red-500">
                    {error}
                </span>
            )}

            {suggested.length > 0 && (
                <div className="mt-2">
                    <p className="mb-1.5 text-xs text-muted">
                        Saran tag — boleh dipakai atau bikin sendiri:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                        {suggested.map((tag) => {
                            const picked = value.includes(tag);

                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    disabled={picked || full}
                                    onClick={() => add(tag)}
                                    className={cn(
                                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                                        picked
                                            ? 'cursor-not-allowed border-line bg-canvas text-muted'
                                            : 'border-line text-muted hover:border-primary/40 hover:text-primary',
                                        full && !picked && 'opacity-50',
                                    )}
                                >
                                    {!picked && <Plus className="size-3" />}#
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
