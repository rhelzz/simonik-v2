import {
    Award,
    BookOpen,
    Building2,
    Camera,
    CalendarDays,
    ClipboardCheck,
    ClipboardList,
    Fingerprint,
    Gavel,
    GraduationCap,
    LayoutDashboard,
    MapPin,
    MessagesSquare,
    Network,
    NotebookPen,
    School,
    Settings,
    UserCheck,
    UserCog,
    Users,
} from 'lucide-react';
import { index as activitiesIndex } from '@/actions/App/Http/Controllers/ActivityController';
import { index as kegiatanIndex } from '@/actions/App/Http/Controllers/ActivityMonitorController';
import { index as absensiIndex } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { index as classesIndex } from '@/actions/App/Http/Controllers/ClassController';
import { index as departemensIndex } from '@/actions/App/Http/Controllers/DepartemenController';
import { index as industriesIndex } from '@/actions/App/Http/Controllers/IndustryController';
import { index as pembimbingsIndex } from '@/actions/App/Http/Controllers/PembimbingController';
import { edit as profileEdit } from '@/actions/App/Http/Controllers/ProfileController';
import { index as studentsIndex } from '@/actions/App/Http/Controllers/StudentController';
import { index as teachersIndex } from '@/actions/App/Http/Controllers/TeacherController';
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
            { label: 'Panduan PKL', icon: BookOpen },
        ],
    },
    {
        title: 'Manajemen',
        items: [
            {
                label: 'Siswa',
                icon: GraduationCap,
                href: studentsIndex.url(),
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            {
                label: 'Guru',
                icon: Users,
                href: teachersIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Pembimbing',
                icon: UserCheck,
                href: pembimbingsIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Industri',
                icon: Building2,
                href: industriesIndex.url(),
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            {
                label: 'Jurusan',
                icon: Network,
                href: departemensIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Kelas',
                icon: School,
                href: classesIndex.url(),
                roles: ['admin', 'kaprog'],
            },
        ],
    },
    {
        title: 'Monitoring',
        items: [
            {
                label: 'Absensi',
                icon: Fingerprint,
                href: absensiIndex.url(),
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
                label: 'Absen Foto + Geo',
                icon: Camera,
                roles: ['siswa'],
            },
            {
                label: 'Jurnal Saya',
                icon: NotebookPen,
                href: activitiesIndex.url(),
                roles: ['siswa'],
            },
            {
                label: 'Kegiatan',
                icon: ClipboardList,
                href: kegiatanIndex.url(),
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
                label: 'Jadwal',
                icon: CalendarDays,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            {
                label: 'Kunjungan',
                icon: MapPin,
                roles: ['admin', 'kaprog', 'guru', 'pembimbing'],
            },
            { label: 'Forum PKL', icon: MessagesSquare },
        ],
    },
    {
        title: 'Penilaian',
        items: [
            {
                label: 'Rekap Penilaian',
                icon: ClipboardCheck,
                roles: [
                    'admin',
                    'kaprog',
                    'guru',
                    'pembimbing',
                    'industri',
                    'mitra',
                    'siswa',
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
        title: 'Akun',
        items: [
            { label: 'Profil', icon: UserCog, href: profileEdit.url() },
            { label: 'Pengaturan', icon: Settings, roles: ['admin'] },
        ],
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
