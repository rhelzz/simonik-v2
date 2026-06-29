import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/TeacherController';
import { AppLayout } from '@/layouts/app-layout';

type TeacherShowProps = {
    teacher: {
        id: number;
        name: string;
        email: string;
        no_hp: string;
        departemen: string;
    };
    industries: Array<{
        id: number;
        name: string;
    }>;
    students_count: number;
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

export default function TeacherShow({
    teacher,
    industries,
    students_count,
}: TeacherShowProps) {
    return (
        <AppLayout title={`Detail Guru - ${teacher.name}`}>
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

                {/* Data Guru */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        {teacher.name}
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem label="Email" value={teacher.email} />
                        <DetailItem label="No. HP" value={teacher.no_hp} />
                        <DetailItem
                            label="Jurusan"
                            value={teacher.departemen}
                        />
                    </div>
                </section>

                {/* Perusahaan & Siswa */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        Perusahaan &amp; Siswa
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem
                            label="Jumlah Siswa yang Dibimbing"
                            value={students_count}
                        />
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Perusahaan yang Diampu
                            </p>
                            {industries.length === 0 ? (
                                <p className="text-sm text-ink">—</p>
                            ) : (
                                <ul className="space-y-2">
                                    {industries.map((industry) => (
                                        <li key={industry.id} className="text-sm text-ink">
                                            • {industry.name}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
