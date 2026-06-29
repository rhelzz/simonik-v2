import { Link } from '@inertiajs/react';
import { ChevronRight, School } from 'lucide-react';
import {
    index,
    students,
} from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AppLayout } from '@/layouts/app-layout';

type ClassCard = {
    id: number;
    name: string;
    students: number;
};

type Props = {
    departemen: { id: number; name: string };
    classes: ClassCard[];
};

export default function AttendanceMonitorClasses({
    departemen,
    classes,
}: Props) {
    return (
        <AppLayout title="Data Absen">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <Breadcrumb
                    items={[
                        { label: 'Data Absen', href: index.url() },
                        { label: departemen.name },
                    ]}
                />

                <h2 className="mt-4 text-base font-bold text-ink">
                    Pilih kelas
                </h2>
                <p className="text-sm text-muted">
                    Kelas pada jurusan {departemen.name}.
                </p>

                {classes.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <School className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada kelas dengan murid
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {classes.map((klass) => (
                            <Link
                                key={klass.id}
                                href={students.url(klass.id)}
                                prefetch
                                className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/40 p-4 transition-colors hover:border-primary/40 hover:bg-canvas"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="grid size-10 place-items-center rounded-xl bg-surface text-primary">
                                        <School className="size-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-ink">
                                            {klass.name}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {klass.students} murid
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="size-5 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </AppLayout>
    );
}
