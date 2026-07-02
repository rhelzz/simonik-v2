import { router } from '@inertiajs/react';
import { ClipboardList, Search, UserCheck } from 'lucide-react';
import { useState } from 'react';
import {
    index,
    update,
} from '@/actions/App/Http/Controllers/PlacementController';
import { Pagination } from '@/components/ui/pagination';
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

type PlacementsIndexProps = {
    students: Paginated<PlacementStudent>;
    filters: { search: string };
    industries: IndustryOption[];
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
                    <span className="text-xs text-muted">Belum ada</span>
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
}: PlacementsIndexProps) {
    const [search, setSearch] = useState(filters.search);

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

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            index.url(),
                            { search },
                            {
                                preserveState: true,
                                replace: true,
                                preserveScroll: true,
                            },
                        );
                    }}
                    className="mt-5"
                >
                    <label className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted">
                        <Search className="size-4" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama atau NIS…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

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
