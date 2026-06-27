import {
    Award,
    Building2,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    Fingerprint,
    Gavel,
    GraduationCap,
    LayoutDashboard,
    MapPin,
    MessageSquareText,
    Network,
    School,
    Settings,
    UserCheck,
    Users,
} from 'lucide-react';
import { dashboard } from '@/routes';
import type { NavSection } from '@/types';
import type { Role } from '@/types/auth';

/**
 * Full sidebar map. Only built features carry an `href`; the rest render as
 * "coming soon" until their route exists. `roles` limits who sees an item.
 */
export const navSections: NavSection[] = [
    {
        title: 'Utama',
        items: [
            {
                label: 'Dashboard',
                icon: LayoutDashboard,
                href: dashboard().url,
            },
        ],
    },
    {
        title: 'Manajemen',
        items: [
            {
                label: 'Siswa',
                icon: GraduationCap,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            { label: 'Guru', icon: Users, roles: ['admin', 'kaprog'] },
            {
                label: 'Pembimbing',
                icon: UserCheck,
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Industri',
                icon: Building2,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            { label: 'Jurusan', icon: Network, roles: ['admin', 'kaprog'] },
            { label: 'Kelas', icon: School, roles: ['admin', 'kaprog'] },
        ],
    },
    {
        title: 'Monitoring',
        items: [
            { label: 'Absensi', icon: Fingerprint },
            {
                label: 'Kegiatan',
                icon: ClipboardList,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing', 'siswa'],
            },
            {
                label: 'Jadwal',
                icon: CalendarDays,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            {
                label: 'Kunjungan',
                icon: MapPin,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            {
                label: 'Bimbingan',
                icon: MessageSquareText,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing', 'siswa'],
            },
        ],
    },
    {
        title: 'Penilaian',
        items: [
            {
                label: 'Penilaian',
                icon: ClipboardCheck,
                roles: [
                    'admin',
                    'kaprog',
                    'guru',
                    'pembimbing',
                    'industri',
                    'mitra',
                ],
            },
            {
                label: 'Sidang',
                icon: Gavel,
                roles: ['admin', 'kaprog', 'guru'],
            },
            {
                label: 'Sertifikat',
                icon: Award,
                roles: ['admin', 'kaprog', 'siswa'],
            },
        ],
    },
    {
        title: 'Sistem',
        items: [{ label: 'Pengaturan', icon: Settings, roles: ['admin'] }],
    },
];

/**
 * Keep only the sections/items visible to the given roles. Items without a
 * `roles` list are visible to everyone. When no role is present (e.g. not yet
 * authenticated in dev) the full map is returned so the shell stays explorable.
 */
export function navForRoles(roles: Role[]): NavSection[] {
    if (roles.length === 0) {
        return navSections;
    }

    return navSections
        .map((section) => ({
            ...section,
            items: section.items.filter(
                (item) =>
                    !item.roles ||
                    item.roles.some((role) => roles.includes(role)),
            ),
        }))
        .filter((section) => section.items.length > 0);
}
