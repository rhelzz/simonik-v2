import { cn } from '@/lib/utils';

/** Domain baku seluruh akun — samakan dengan `ImportDefaults::EMAIL_DOMAIN`. */
export const EMAIL_DOMAIN = 'simonik.local';

/** Buang domain baku dari email lengkap, sisakan username-nya. */
export function usernameOf(email?: string): string {
    if (!email) {
        return '';
    }

    return email.endsWith(`@${EMAIL_DOMAIN}`)
        ? email.slice(0, -(EMAIL_DOMAIN.length + 1))
        : email;
}

/**
 * Input email dengan domain tetap tercetak di sebelah kanan.
 *
 * Operator hanya mengetik username; domainnya disusun di backend
 * (`ImportDefaults::email()`). Dengan begitu domain tidak bisa salah ketik —
 * dicegah, bukan sekadar ditolak setelah diketik.
 *
 * Akun lama boleh berdomain lain: bila nilainya sudah memuat "@", teks utuhnya
 * ditampilkan dan sufiksnya disembunyikan.
 */
export function EmailInput({
    id = 'email',
    name = 'email',
    value,
    onChange,
    placeholder = 'nama.lengkap',
    required,
    className,
}: {
    id?: string;
    name?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
}) {
    const custom = value.includes('@');
    const hintId = `${id}-domain`;

    return (
        <div className="space-y-1">
            <div
                className={cn(
                    'flex items-stretch overflow-hidden rounded-xl border border-line bg-canvas/40 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                    className,
                )}
            >
                <input
                    id={id}
                    name={name}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    required={required}
                    aria-describedby={custom ? undefined : hintId}
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none"
                />
                {!custom && (
                    <span
                        aria-hidden="true"
                        className="grid shrink-0 place-items-center border-l border-line bg-canvas px-3 text-sm font-medium text-muted"
                    >
                        @{EMAIL_DOMAIN}
                    </span>
                )}
            </div>
            {!custom && (
                <p id={hintId} className="text-xs text-muted">
                    Cukup ketik username; email lengkapnya menjadi{' '}
                    <span className="font-medium text-ink">
                        {value || placeholder}@{EMAIL_DOMAIN}
                    </span>
                    .
                </p>
            )}
        </div>
    );
}
