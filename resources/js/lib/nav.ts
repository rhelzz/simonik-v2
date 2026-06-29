import {
    Award,
    BookOpen,
    Building2,
    CalendarDays,
    CalendarRange,
    Camera,
    ClipboardCheck,
    FileImage,
    Fingerprint,
    GraduationCap,
    HardHat,
    LayoutDashboard,
    ListChecks,
    MessagesSquare,
    Network,
    NotebookPen,
    School,
    UserCheck,
    UserCog,
    Users,
    UsersRound,
} from 'lucide-react';
import { index as activitiesIndex } from '@/actions/App/Http/Controllers/ActivityController';
import { index as aspectsIndex } from '@/actions/App/Http/Controllers/AspectController';
import { index as assessmentsIndex } from '@/actions/App/Http/Controllers/AssessmentController';
import { index as attendanceIndex } from '@/actions/App/Http/Controllers/AttendanceController';
import { index as attendanceMonitorIndex } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { index as certificatesIndex } from '@/actions/App/Http/Controllers/CertificateController';
import { index as certificateTemplatesIndex } from '@/actions/App/Http/Controllers/CertificateTemplateController';
import { index as classesIndex } from '@/actions/App/Http/Controllers/ClassController';
import { index as departemensIndex } from '@/actions/App/Http/Controllers/DepartemenController';
import { index as guidesIndex } from '@/actions/App/Http/Controllers/GuideController';
import { index as industriesIndex } from '@/actions/App/Http/Controllers/IndustryController';
import { index as journalMonitorIndex } from '@/actions/App/Http/Controllers/JournalMonitorController';
import { index as parentsIndex } from '@/actions/App/Http/Controllers/ParentController';
import { index as pembimbingsIndex } from '@/actions/App/Http/Controllers/PembimbingController';
import { index as periodsIndex } from '@/actions/App/Http/Controllers/PeriodController';
import { edit as profileEdit } from '@/actions/App/Http/Controllers/ProfileController';
import { index as studentsIndex } from '@/actions/App/Http/Controllers/StudentController';
import { index as teachersIndex } from '@/actions/App/Http/Controllers/TeacherController';
import { dashboard } from '@/routes';
import type { NavItem, NavSection } from '@/types';
import type { Role } from '@/types/auth';

const STAFF: Role[] = [
    'admin',
    'kaprog',
    'guru',
    'pembimbing',
    'industri',
    'mitra',
];

/**
 * Full sidebar map. Only built features carry an `href`; the rest render as
 * "coming soon" until their route exists. `roles` limits who sees an item;
 * items with `children` render as a collapsible dropdown.
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
        title: 'PKL Saya',
        items: [
            {
                label: 'Absen Foto + Geo',
                icon: Camera,
                href: attendanceIndex.url(),
                roles: ['siswa'],
            },
            {
                label: 'Jurnal Saya',
                icon: NotebookPen,
                href: activitiesIndex.url(),
                roles: ['siswa'],
            },
        ],
    },
    {
        title: 'Data Master',
        items: [
            {
                label: 'Data User',
                icon: Users,
                roles: ['admin', 'kaprog'],
                children: [
                    {
                        label: 'Data Siswa',
                        icon: GraduationCap,
                        href: studentsIndex.url(),
                    },
                    {
                        label: 'Guru Pembimbing',
                        icon: UserCheck,
                        href: teachersIndex.url(),
                    },
                    {
                        label: 'Data Industri',
                        icon: Building2,
                        href: industriesIndex.url(),
                    },
                    {
                        label: 'Pembimbing Industri',
                        icon: HardHat,
                        href: pembimbingsIndex.url(),
                    },
                    {
                        label: 'Orang Tua',
                        icon: UsersRound,
                        href: parentsIndex.url(),
                    },
                ],
            },
            {
                label: 'Data Jurusan',
                icon: Network,
                href: departemensIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Data Kelas',
                icon: School,
                href: classesIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Periode PKL',
                icon: CalendarRange,
                href: periodsIndex.url(),
                roles: ['admin', 'kaprog'],
            },
        ],
    },
    {
        title: 'Dokumen & Forum',
        items: [
            {
                label: 'Panduan PKL',
                icon: BookOpen,
                href: guidesIndex.url(),
            },
            { label: 'Forum PKL', icon: MessagesSquare },
        ],
    },
    {
        title: 'Monitoring',
        items: [
            {
                label: 'Data Absen',
                icon: Fingerprint,
                href: attendanceMonitorIndex.url(),
                roles: [...STAFF, 'orangtua'],
            },
            {
                label: 'Data Jurnal',
                icon: NotebookPen,
                href: journalMonitorIndex.url(),
                roles: [...STAFF, 'orangtua'],
            },
            { label: 'Kalender', icon: CalendarDays, roles: STAFF },
        ],
    },
    {
        title: 'Penilaian',
        items: [
            {
                label: 'Rekap Penilaian',
                icon: ClipboardCheck,
                href: assessmentsIndex.url(),
                roles: [...STAFF, 'siswa', 'orangtua'],
            },
            {
                label: 'Aspek Penilaian',
                icon: ListChecks,
                href: aspectsIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Sertifikat',
                icon: Award,
                href: certificatesIndex.url(),
                roles: ['admin', 'kaprog', 'siswa'],
            },
            {
                label: 'Template Sertifikat',
                icon: FileImage,
                href: certificateTemplatesIndex.url(),
                roles: ['admin', 'kaprog'],
            },
        ],
    },
    {
        title: 'Akun',
        items: [{ label: 'Profil', icon: UserCog, href: profileEdit.url() }],
    },
];

/**
 * Keep only the sections/items (and child items) visible to the given roles.
 * Items without a `roles` list are visible to everyone. When no role is present
 * (e.g. not yet authenticated in dev) the full map is returned.
 */
export function navForRoles(roles: Role[]): NavSection[] {
    if (roles.length === 0) {
        return navSections;
    }

    const visible = (item: NavItem): boolean =>
        !item.roles || item.roles.some((role) => roles.includes(role));

    return navSections
        .map((section) => ({
            ...section,
            items: section.items
                .filter(visible)
                .map((item) =>
                    item.children
                        ? { ...item, children: item.children.filter(visible) }
                        : item,
                )
                .filter((item) => !item.children || item.children.length > 0),
        }))
        .filter((section) => section.items.length > 0);
}
