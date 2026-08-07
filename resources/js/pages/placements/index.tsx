import { Link, router } from '@inertiajs/react';
import {
    ClipboardList,
    Search,
    TriangleAlert,
    UserCheck,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { edit as editIndustry } from '@/actions/App/Http/Controllers/IndustryController';
import {
    index,
    update,
} from '@/actions/App/Http/Controllers/PlacementController';
import { Pagination } from '@/components/ui/pagination';
import { Select } from '@/components/ui/select';
import type { SelectOption } from '@/components/ui/select';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type StatusPkl = 'belum' | 'proses' | 'selesai';

type PlacementStudent = {
    id: number;
    name: string;
    nis: string;
    class: string | null;
    departemen: string | null;
    industri_id: number;
    industry: string | null;
    guru: string | null;
    status_pkl: StatusPkl;
};

type IndustryOption = {
    id: number;
    name: string;
    guru: string | null;
};

type UnassignedIndustry = {
    id: number;
    name: string;
};

type NamedOption = { id: number; name: string };

type PlacementFilters = {
    search: string;
    class_id: number | null;
    industri_id: number | null;
    teacher_id: number | null;
    status_pkl: StatusPkl | null;
};

type PlacementsIndexProps = {
    students: Paginated<PlacementStudent>;
    filters: PlacementFilters;
    industries: IndustryOption[];
    classOptions: NamedOption[];
    teacherOptions: NamedOption[];
    unassignedIndustries: UnassignedIndustry[];
};

const statusLabels: Record<StatusPkl, string> = {
    belum: 'Belum mulai',
    proses: 'Berjalan',
    selesai: 'Selesai',
};

const rowGrid =
    'grid grid-cols-1 gap-x-5 gap-y-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:items-center';

const selectClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-3 py-2.5 text-sm text-ink transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

function FieldLabel({ children }: { children: string }) {
    return (
        <span className="mb-1 block text-xs font-medium text-muted lg:hidden">
            {children}
        </span>
    );
}

function PlacementRow({
    student,
    industries,
}: {
    student: PlacementStudent;
    industries: IndustryOption[];
}) {
    const [industriId, setIndustriId] = useState(student.industri_id);
    const [status, setStatus] = useState<StatusPkl>(student.status_pkl);

    function save(nextIndustri: number, nextStatus: StatusPkl) {
        router.patch(
            update.url(student.id),
            { industri_id: nextIndustri, status_pkl: nextStatus },
            { preserveScroll: true, preserveState: true },
        );
    }

    const guru =
        industries.find((i) => i.id === industriId)?.guru ?? student.guru;

    return (
        <div className={cn(rowGrid, 'rounded-2xl border border-line p-4')}>
            {/* Siswa */}
            <div className="min-w-0">
                <p className="truncate font-semibold text-ink">
                    {student.name}
                </p>
                <p className="truncate text-xs text-muted">
                    NIS {student.nis}
                    {student.class ? ` · ${student.class}` : ''}
                </p>
            </div>

            {/* Industri */}
            <div className="min-w-0">
                <FieldLabel>Industri</FieldLabel>
                <select
                    value={industriId}
                    onChange={(event) => {
                        const next = Number(event.target.value);
                        setIndustriId(next);
                        save(next, status);
                    }}
                    className={selectClass}
                >
                    {industries.map((industry) => (
                        <option key={industry.id} value={industry.id}>
                            {industry.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Guru pembimbing (mengikuti industri) */}
            <div className="min-w-0">
                <FieldLabel>Guru pembimbing</FieldLabel>
                {guru ? (
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg bg-primary-soft px-2.5 py-1.5 text-xs font-medium text-primary">
                        <UserCheck className="size-3.5 shrink-0" />
                        <span className="truncate">{guru}</span>
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warning">
                        <TriangleAlert className="size-3.5 shrink-0" />
                        Belum ada
                    </span>
                )}
            </div>

            {/* Status PKL */}
            <div className="min-w-0">
                <FieldLabel>Status PKL</FieldLabel>
                <select
                    value={status}
                    onChange={(event) => {
                        const next = event.target.value as StatusPkl;
                        setStatus(next);
                        save(industriId, next);
                    }}
                    className={cn(
                        selectClass,
                        'font-semibold',
                        status === 'proses' && 'text-warning',
                        status === 'selesai' && 'text-positive',
                    )}
                >
                    {(Object.keys(statusLabels) as StatusPkl[]).map((value) => (
                        <option key={value} value={value}>
                            {statusLabels[value]}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export default function PlacementsIndex({
    students,
    filters,
    industries,
    classOptions,
    teacherOptions,
    unassignedIndustries,
}: PlacementsIndexProps) {
    const [search, setSearch] = useState(filters.search);

    function applyFilters(next: {
        search?: string;
        class_id?: string;
        industri_id?: string;
        teacher_id?: string;
        status_pkl?: string;
    }) {
        router.get(
            index.url(),
            {
                search: next.search ?? search,
                class_id: next.class_id ?? String(filters.class_id ?? ''),
                industri_id:
                    next.industri_id ?? String(filters.industri_id ?? ''),
                teacher_id: next.teacher_id ?? String(filters.teacher_id ?? ''),
                status_pkl: next.status_pkl ?? filters.status_pkl ?? '',
            },
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    function resetFilters() {
        setSearch('');
        router.get(
            index.url(),
            {},
            { preserveState: true, replace: true, preserveScroll: true },
        );
    }

    const classFilterOptions: SelectOption[] = [
        { value: '', label: 'Semua kelas' },
        ...classOptions.map((c) => ({ value: String(c.id), label: c.name })),
    ];
    const industryFilterOptions: SelectOption[] = [
        { value: '', label: 'Semua industri' },
        ...industries.map((i) => ({ value: String(i.id), label: i.name })),
    ];
    const teacherFilterOptions: SelectOption[] = [
        { value: '', label: 'Semua guru pembimbing' },
        ...teacherOptions.map((t) => ({ value: String(t.id), label: t.name })),
    ];
    const statusFilterOptions: SelectOption[] = [
        { value: '', label: 'Semua status PKL' },
        ...(Object.keys(statusLabels) as StatusPkl[]).map((value) => ({
            value,
            label: statusLabels[value],
        })),
    ];

    const activeCount =
        (filters.search ? 1 : 0) +
        (filters.class_id ? 1 : 0) +
        (filters.industri_id ? 1 : 0) +
        (filters.teacher_id ? 1 : 0) +
        (filters.status_pkl ? 1 : 0);

    return (
        <AppLayout title="Plotting & Penempatan">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div>
                    <h2 className="text-base font-bold text-ink">
                        Plotting & Penempatan Siswa
                    </h2>
                    <p className="text-sm text-muted">
                        {students.total} siswa dalam program keahlian Anda —
                        pilih industri untuk menentukan penempatan & guru
                        pembimbing.
                    </p>
                </div>

                {unassignedIndustries.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2 rounded-2xl bg-warning/10 p-4 text-sm text-warning">
                        <div className="flex items-center gap-2 font-medium">
                            <TriangleAlert className="size-4 shrink-0" />
                            {unassignedIndustries.length} industri belum punya
                            guru pembimbing — siswa di sana tidak akan terlihat
                            oleh akun guru manapun.
                        </div>
                        <ul className="flex flex-wrap gap-2">
                            {unassignedIndustries.map((industry) => (
                                <li key={industry.id}>
                                    <Link
                                        href={editIndustry.url(industry.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-warning underline-offset-2 hover:underline"
                                    >
                                        {industry.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mt-5 space-y-3">
                    <div className="flex flex-col gap-3 lg:flex-row">
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                applyFilters({ search });
                            }}
                            className="flex flex-1 items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15"
                        >
                            <Search className="size-4" />
                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Cari nama atau NIS…"
                                className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                            />
                        </form>
                        <div className="grid grid-cols-2 gap-3 lg:flex lg:shrink-0">
                            <Select
                                ariaLabel="Filter kelas"
                                className="lg:w-44"
                                value={String(filters.class_id ?? '')}
                                options={classFilterOptions}
                                onChange={(value) =>
                                    applyFilters({ class_id: value })
                                }
                                placeholder="Semua kelas"
                            />
                            <Select
                                ariaLabel="Filter industri"
                                className="lg:w-48"
                                value={String(filters.industri_id ?? '')}
                                options={industryFilterOptions}
                                onChange={(value) =>
                                    applyFilters({ industri_id: value })
                                }
                                placeholder="Semua industri"
                            />
                            <Select
                                ariaLabel="Filter guru pembimbing"
                                className="lg:w-52"
                                value={String(filters.teacher_id ?? '')}
                                options={teacherFilterOptions}
                                onChange={(value) =>
                                    applyFilters({ teacher_id: value })
                                }
                                placeholder="Semua guru pembimbing"
                            />
                            <Select
                                ariaLabel="Filter status PKL"
                                className="lg:w-44"
                                value={filters.status_pkl ?? ''}
                                options={statusFilterOptions}
                                onChange={(value) =>
                                    applyFilters({ status_pkl: value })
                                }
                                placeholder="Semua status PKL"
                            />
                        </div>
                    </div>

                    {activeCount > 0 && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span>
                                {students.total} hasil · {activeCount} filter
                                aktif
                            </span>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 font-medium text-ink/70 transition-colors hover:bg-primary-soft hover:text-primary"
                            >
                                <X className="size-3" />
                                Reset filter
                            </button>
                        </div>
                    )}
                </div>

                {industries.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed border-line py-12 text-center text-sm text-muted">
                        Belum ada industri terdaftar untuk penempatan.
                    </div>
                ) : students.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <ClipboardList className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada siswa dalam program keahlian Anda
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 space-y-2.5">
                        {/* Header kolom (desktop) */}
                        <div
                            className={cn(
                                rowGrid,
                                'hidden px-4 text-xs font-semibold tracking-wide text-muted uppercase lg:grid',
                            )}
                        >
                            <span>Siswa</span>
                            <span>Industri (penempatan)</span>
                            <span>Guru pembimbing</span>
                            <span>Status PKL</span>
                        </div>

                        {students.data.map((student) => (
                            <PlacementRow
                                key={student.id}
                                student={student}
                                industries={industries}
                            />
                        ))}
                    </div>
                )}

                <Pagination meta={students} />
            </section>
        </AppLayout>
    );
}
