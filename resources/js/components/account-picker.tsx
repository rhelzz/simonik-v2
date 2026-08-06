import { router } from '@inertiajs/react';
import { Check, Search, UserPlus, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type AccountCandidate = {
    id: number;
    name: string;
    email: string;
    roles: string[];
};

/**
 * Pilih cara mengisi akun untuk sebuah jabatan: buat akun baru, atau tautkan
 * jabatan ini ke akun yang sudah ada.
 *
 * Tanpa opsi kedua, seorang guru pembimbing yang juga diangkat jadi kaprog
 * terpaksa dibuatkan akun kedua dengan email berbeda — penyebab keluhan "akun
 * bentrok, tidak bisa login".
 *
 * Kandidat datang sebagai prop halaman dan disegarkan lewat partial reload,
 * bukan endpoint JSON terpisah.
 */
export function AccountPicker({
    candidates,
    selected,
    onSelect,
    error,
}: {
    candidates: AccountCandidate[];
    selected: AccountCandidate | null;
    onSelect: (account: AccountCandidate | null) => void;
    error?: string;
}) {
    const [existing, setExisting] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!existing) {
            return;
        }

        const timer = setTimeout(() => {
            router.reload({
                only: ['candidates'],
                data: { q: search },
                replace: true,
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [existing, search]);

    function choose(mode: 'baru' | 'ada') {
        setExisting(mode === 'ada');

        if (mode === 'baru') {
            onSelect(null);
            setSearch('');
        }
    }

    return (
        <div className="space-y-3 sm:col-span-2">
            <div className="flex flex-wrap gap-2">
                <ModeButton
                    active={!existing}
                    onClick={() => choose('baru')}
                    icon={<UserPlus className="size-4" />}
                    label="Buat akun baru"
                />
                <ModeButton
                    active={existing}
                    onClick={() => choose('ada')}
                    icon={<Users className="size-4" />}
                    label="Gunakan akun yang sudah ada"
                />
            </div>

            {existing && !selected && (
                <>
                    <div className="relative">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama atau email akun…"
                            aria-label="Cari akun yang sudah terdaftar"
                            className="w-full rounded-xl border border-line bg-canvas/40 py-2.5 pr-4 pl-9 text-sm text-ink transition-colors placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                    </div>

                    {search.trim().length < 2 ? (
                        <p className="text-xs text-muted">
                            Ketik minimal 2 huruf. Akun siswa & orang tua tidak
                            ditampilkan — jabatan kepegawaian tidak boleh
                            dirangkap dengan keduanya.
                        </p>
                    ) : candidates.length === 0 ? (
                        <p className="text-xs text-muted">
                            Tidak ada akun cocok yang bisa diberi jabatan ini.
                            Mungkin akunnya sudah memegang jabatan tersebut —
                            atau buat akun baru.
                        </p>
                    ) : (
                        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                            {candidates.map((account) => (
                                <li key={account.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(account)}
                                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-canvas"
                                    >
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-ink">
                                                {account.name}
                                            </span>
                                            <span className="block truncate text-xs text-muted">
                                                {account.email}
                                            </span>
                                        </span>
                                        {account.roles.map((role) => (
                                            <span
                                                key={role}
                                                className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary"
                                            >
                                                {role}
                                            </span>
                                        ))}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}

            {selected && (
                <div className="flex items-center gap-3 rounded-xl border border-primary/40 bg-primary-soft/40 px-4 py-3">
                    <Check className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-ink">
                            {selected.name}
                        </span>
                        <span className="block truncate text-xs text-muted">
                            {selected.email} · sudah menjabat{' '}
                            {selected.roles.join(', ')}
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => onSelect(null)}
                        aria-label="Batalkan pilihan akun"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-ink"
                    >
                        <X className="size-4" />
                    </button>
                    <input type="hidden" name="user_id" value={selected.id} />
                </div>
            )}

            {selected && (
                <p className="text-xs text-muted">
                    Jabatan ini ditambahkan ke akun tersebut. Nama, email, dan
                    kata sandinya tidak berubah — orangnya tetap masuk memakai
                    kredensial yang sudah dipakai selama ini.
                </p>
            )}

            {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
}

function ModeButton({
    active,
    onClick,
    icon,
    label,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors',
                active
                    ? 'border-primary bg-primary text-white'
                    : 'border-line text-ink/70 hover:bg-canvas',
            )}
        >
            {icon}
            {label}
        </button>
    );
}
