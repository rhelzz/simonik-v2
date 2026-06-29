import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { index } from '@/actions/App/Http/Controllers/StudentController';
import { AppLayout } from '@/layouts/app-layout';

type StudentShowProps = {
    student: {
        id: number;
        name: string;
        email: string;
        nis: string;
        gender: string;
        placeOfBirth: string;
        dateOfBirth: string;
        bloodType: string;
        alamat: string;
        status_pkl: string;
        pkl_start: string | null;
        pkl_end: string | null;
    };
    relations: {
        class: string;
        departemen: string;
        industri: string;
        guru_pembimbing: string;
        pembimbing_industri: string;
        orang_tua: string;
    };
};

const statusLabels: Record<string, string> = {
    belum: 'Belum mulai',
    proses: 'Berjalan',
    selesai: 'Selesai',
};

const statusStyles: Record<string, string> = {
    belum: 'bg-canvas text-muted',
    proses: 'bg-warning/15 text-warning',
    selesai: 'bg-positive/15 text-positive',
};

function DetailItem({
    label,
    value,
}: {
    label: string;
    value: string | null | undefined;
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

export default function StudentShow({
    student,
    relations,
}: StudentShowProps) {
    return (
        <AppLayout title={`Detail Siswa - ${student.name}`}>
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

                {/* Data Pribadi */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        {student.name}
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem label="Email" value={student.email} />
                        <DetailItem label="NIS" value={student.nis} />
                        <DetailItem
                            label="Tempat Lahir"
                            value={student.placeOfBirth}
                        />
                        <DetailItem
                            label="Tanggal Lahir"
                            value={student.dateOfBirth}
                        />
                        <DetailItem
                            label="Jenis Kelamin"
                            value={
                                student.gender === 'L' ? 'Laki-laki' : 'Perempuan'
                            }
                        />
                        <DetailItem
                            label="Golongan Darah"
                            value={student.bloodType}
                        />
                        <DetailItem
                            label="Alamat"
                            value={student.alamat}
                        />
                    </div>
                </section>

                {/* PKL & Penempatan */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        PKL &amp; Penempatan
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Status PKL
                            </p>
                            <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${statusStyles[student.status_pkl] || 'bg-canvas text-muted'}`}
                            >
                                {statusLabels[student.status_pkl] ||
                                    student.status_pkl}
                            </span>
                        </div>
                        <DetailItem
                            label="Jurusan"
                            value={relations.departemen}
                        />
                        <DetailItem
                            label="Kelas"
                            value={relations.class}
                        />
                        <DetailItem
                            label="Industri"
                            value={relations.industri}
                        />
                        <DetailItem
                            label="Mulai PKL"
                            value={student.pkl_start}
                        />
                        <DetailItem
                            label="Selesai PKL"
                            value={student.pkl_end}
                        />
                    </div>
                </section>

                {/* Pembimbing & Relasi */}
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <h2 className="mb-4 text-base font-bold text-ink">
                        Pembimbing &amp; Relasi
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <DetailItem
                            label="Guru Pembimbing"
                            value={relations.guru_pembimbing}
                        />
                        <DetailItem
                            label="Pembimbing Industri"
                            value={relations.pembimbing_industri}
                        />
                        <DetailItem
                            label="Orang Tua / Wali"
                            value={relations.orang_tua}
                        />
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
