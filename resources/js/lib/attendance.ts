/**
 * Label & gaya badge status absensi (case-insensitive). Selaras dengan nilai
 * `attendances.status` yang ditulis modul absen siswa: hadir/izin/sakit/alpha.
 */
export function attendanceLabel(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
        case 'hadir':
        case 'masuk':
            return 'Hadir';
        case 'izin':
            return 'Izin';
        case 'sakit':
            return 'Sakit';
        case 'libur':
            return 'Libur';
        case 'alpha':
            return 'Alpha';
        default:
            return 'Belum absen';
    }
}

export function attendanceStyle(status: string | null): string {
    switch ((status ?? '').toLowerCase()) {
        case 'hadir':
        case 'masuk':
            return 'bg-positive/15 text-positive';
        case 'izin':
            return 'bg-warning/15 text-warning';
        case 'sakit':
            return 'bg-primary/10 text-primary';
        case 'libur':
            return 'bg-cyan-500/10 text-cyan-500';
        case 'alpha':
            return 'bg-red-50 text-red-600';
        default:
            return 'bg-canvas text-muted';
    }
}
