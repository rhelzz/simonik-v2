import { Eye } from 'lucide-react';

/**
 * Menyatakan secara terbuka data siapa yang sedang ditampilkan.
 *
 * Pembatasan per-role dilakukan diam-diam di query, sehingga daftar yang
 * pendek (atau kosong) tidak bisa dibedakan dari sistem yang rusak. Kalimatnya
 * disusun di backend lewat `ScopesStudentsByRole::scopeLabel()`.
 */
export function ScopeNote({ label }: { label: string }) {
    return (
        <p className="mt-2 inline-flex items-start gap-1.5 rounded-lg bg-canvas px-2.5 py-1.5 text-xs font-medium text-muted">
            <Eye className="mt-px size-3.5 shrink-0" />
            <span>{label}</span>
        </p>
    );
}
