/**
 * Tampilan status kehadiran. Nilai status bisa beragam (mis. `hadir`, `masuk`,
 * `pulang`, `izin`, `sakit`, `alpha`) tergantung sumber data absensi, jadi
 * pemetaan dibuat case-insensitive dengan fallback netral.
 */

const badgeByStatus: Record<string, string> = {
    hadir: 'bg-positive/15 text-positive',
    masuk: 'bg-positive/15 text-positive',
    pulang: 'bg-primary-soft text-primary',
    izin: 'bg-warning/15 text-warning',
    sakit: 'bg-warning/15 text-warning',
    alpha: 'bg-red-100 text-red-600',
};

export function statusBadgeClass(status: string | null): string {
    if (!status) {
        return 'bg-canvas text-muted';
    }

    return badgeByStatus[status.toLowerCase()] ?? 'bg-canvas text-muted';
}

export function statusLabel(status: string | null): string {
    if (!status) {
        return '—';
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
}
