import {
    Award,
    BarChart3,
    BookOpen,
    Building2,
    CalendarDays,
    CalendarOff,
    CalendarRange,
    Camera,
    ClipboardCheck,
    FileImage,
    FileText,
    Fingerprint,
    Flame,
    GraduationCap,
    Handshake,
    HardHat,
    HeartPulse,
    LayoutDashboard,
    ListChecks,
    MailCheck,
    MessagesSquare,
    Network,
    NotebookPen,
    School,
    UserCheck,
    UserCog,
    Users,
    UsersRound,
    Wallet,
} from 'lucide-react';
import { index as activitiesIndex } from '@/actions/App/Http/Controllers/ActivityController';
import { index as approvalsIndex } from '@/actions/App/Http/Controllers/ApprovalController';
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
import { index as leaveRequestsIndex } from '@/actions/App/Http/Controllers/LeaveRequestController';
import { show as myIndustryShow } from '@/actions/App/Http/Controllers/MyIndustryController';
import { index as parentsIndex } from '@/actions/App/Http/Controllers/ParentController';
import { index as pembimbingsIndex } from '@/actions/App/Http/Controllers/PembimbingController';
import { index as periodsIndex } from '@/actions/App/Http/Controllers/PeriodController';
import { edit as profileEdit } from '@/actions/App/Http/Controllers/ProfileController';
import { index as sakitIzinIndex } from '@/actions/App/Http/Controllers/SakitIzinController';
import { index as studentsIndex } from '@/actions/App/Http/Controllers/StudentController';
import { index as teachersIndex } from '@/actions/App/Http/Controllers/TeacherController';
import { dashboard, streak } from '@/routes';
import type { NavItem, NavSection } from '@/types';
import type { Role } from '@/types/auth';

const STAFF: Role[] = ['admin', 'wakasek', 'kaprog', 'guru', 'pembimbing'];

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
            {
                label: 'Pengajuan Libur',
                icon: CalendarOff,
                href: leaveRequestsIndex.url(),
                roles: ['siswa'],
            },
            {
                label: 'Sakit & Izin',
                icon: HeartPulse,
                href: sakitIzinIndex.url(),
                roles: ['siswa'],
            },
            {
                label: 'Streak & Badge',
                icon: Flame,
                href: streak.url(),
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
                label: 'Data Industri',
                icon: Building2,
                href: industriesIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Industri Saya',
                icon: Building2,
                href: myIndustryShow.url(),
                roles: ['pembimbing'],
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
            {
                label: 'Inbox Persetujuan',
                icon: MailCheck,
                href: approvalsIndex.url(),
                roles: ['kaprog', 'guru', 'pembimbing', 'orangtua'],
            },
            { label: 'Kalender', icon: CalendarDays, roles: STAFF },
        ],
    },
    {
        title: 'Humas & Keuangan',
        items: [
            {
                label: 'Akuntabilitas Dana',
                icon: Wallet,
                // M5.1 — belum tersedia
                roles: ['wakasek'],
            },
            {
                label: 'Kemitraan & Kuota',
                icon: Handshake,
                // M5.2 — belum tersedia
                roles: ['admin', 'wakasek'],
            },
            {
                label: 'Statistik Global',
                icon: BarChart3,
                // M5.3 — belum tersedia
                roles: ['wakasek'],
            },
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
                roles: ['admin', 'wakasek', 'kaprog', 'siswa'],
            },
            {
                label: 'Template Sertifikat',
                icon: FileImage,
                href: certificateTemplatesIndex.url(),
                roles: ['admin', 'kaprog'],
            },
            {
                label: 'Rapor Digital',
                icon: FileText,
                // M4.2 — belum tersedia
                roles: ['admin', 'wakasek', 'kaprog', 'siswa'],
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
