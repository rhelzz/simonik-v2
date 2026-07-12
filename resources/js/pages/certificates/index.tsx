import { Link, router } from '@inertiajs/react';
import { Award, Search, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import {
    index,
    show,
} from '@/actions/App/Http/Controllers/CertificateController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type StudentRow = {
    id: number;
    name: string;
    nis: string;
    class: string | null;
    industry: string | null;
    eligible: boolean;
    certificatesCount: number;
};

export default function CertificatesIndex({
    students,
    filters,
    hasTemplates,
}: {
    students: Paginated<StudentRow>;
    filters: { search: string };
    hasTemplates: boolean;
}) {
    const [search, setSearch] = useState(filters.search);

    return (
        <AppLayout title="Sertifikat">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-base font-bold text-ink">
                        Cetak sertifikat
                    </h2>
                    <p className="text-sm text-muted">
                        {students.total} siswa · pilih siswa untuk mencetak
                    </p>
                </div>

                {!hasTemplates && (
                    <div className="mt-4 flex items-center gap-2 rounded-2xl bg-warning/10 px-4 py-3 text-sm font-medium text-warning">
                        <TriangleAlert className="size-4 shrink-0" />
                        Belum ada template sertifikat. Buat di menu Template
                        Sertifikat agar sertifikat dapat ditugaskan.
                    </div>
                )}

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

                {students.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Award className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada siswa
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-160 border-collapse text-left text-sm">
                            <thead>
                                <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                    <th className="pb-3 font-semibold">
                                        Siswa
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Kelas
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Industri
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Status PKL
                                    </th>
                                    <th className="pb-3 font-semibold">
                                        Sertifikat
                                    </th>
                                    <th className="pb-3 text-right font-semibold">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {students.data.map((student) => (
                                    <tr key={student.id}>
                                        <td className="py-3">
                                            <p className="font-semibold text-ink">
                                                {student.name}
                                            </p>
                                            <p className="text-xs text-muted">
                                                NIS {student.nis}
                                            </p>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.class ?? '—'}
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.industry ?? '—'}
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className={cn(
                                                    'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                                                    student.eligible
                                                        ? 'bg-positive/15 text-positive'
                                                        : 'bg-canvas text-muted',
                                                )}
                                            >
                                                {student.eligible
                                                    ? 'Selesai'
                                                    : 'Belum selesai'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-ink/80">
                                            {student.certificatesCount}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Link
                                                href={show.url(student.id)}
                                                className="inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-canvas"
                                            >
                                                Kelola sertifikat
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <Pagination meta={students} />
            </section>
        </AppLayout>
    );
}
