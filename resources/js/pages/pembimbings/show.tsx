import { Link } from '@inertiajs/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { index } from '@/actions/App/Http/Controllers/PembimbingController';
import { AppLayout } from '@/layouts/app-layout';

type PembimbingShowProps = {
    pembimbing: {
        id: number;
        name: string;
        email: string;
        no_hp: string;
        gender: string | null;
        industri: string | null;
    };
    students: Array<{
        id: number;
        name: string;
        nis: string;
        email: string | null;
    }>;
    total_students: number;
};

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string | number | null | undefined;
}) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
            </p>
            <p className="text-sm text-ink">{value || '—'}</p>
        </div>
    );
}

export default function PembimbingShow({
    pembimbing,
    students,
    total_students,
}: PembimbingShowProps) {
    const [showAllStudents, setShowAllStudents] = useState(false);
    const displayedStudents = showAllStudents ? students : students.slice(0, 5);
    const hasMore = students.length > 5;

    return (
        <AppLayout title={`Detail Pembimbing - ${pembimbing.name}`}>
            <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link
                        href={index.url()}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali
                    </Link>
                </div>

                {/* Data Pembimbing */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        {pembimbing.name}
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem label="Email" value={pembimbing.email} />
                        <DetailItem label="No. HP" value={pembimbing.no_hp} />
                        <DetailItem
                            label="Jenis Kelamin"
                            value={pembimbing.gender}
                        />
                        <DetailItem
                            label="Industri"
                            value={pembimbing.industri}
                        />
                    </div>
                </section>

                {/* Daftar Murid */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-base font-bold text-ink">
                            Murid ({total_students})
                        </h2>
                    </div>

                    {students.length === 0 ? (
                        <p className="text-sm text-muted">
                            Belum ada murid yang dibimbing.
                        </p>
                    ) : (
                        <>
                            <div className="space-y-2">
                                {displayedStudents.map((student) => (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between rounded-lg border border-line bg-canvas/40 p-3"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-ink">
                                                {student.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                NIS {student.nis}
                                                {student.email
                                                    ? ` · ${student.email}`
                                                    : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {hasMore && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAllStudents(!showAllStudents)
                                    }
                                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover"
                                >
                                    {showAllStudents
                                        ? 'Tampilkan lebih sedikit'
                                        : `Tampilkan semua (${students.length})`}
                                    <ChevronRight className="size-4" />
                                </button>
                            )}
                        </>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
