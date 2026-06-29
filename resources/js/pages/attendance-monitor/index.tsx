import { Link } from '@inertiajs/react';
import { ChevronRight, Fingerprint, Network } from 'lucide-react';
import { classes } from '@/actions/App/Http/Controllers/AttendanceMonitorController';
import { AppLayout } from '@/layouts/app-layout';

type DepartemenCard = {
    id: number;
    name: string;
    students: number;
};

type Props = {
    departemens: DepartemenCard[];
};

export default function AttendanceMonitorIndex({ departemens }: Props) {
    return (
        <AppLayout title="Data Absen">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <Fingerprint className="size-5" />
                    </span>
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Monitoring kehadiran
                        </h2>
                        <p className="text-sm text-muted">
                            Pilih jurusan untuk menelusuri kelas, murid, lalu
                            detail absen.
                        </p>
                    </div>
                </div>

                {departemens.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Network className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada data dalam cakupan Anda
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {departemens.map((departemen) => (
                            <Link
                                key={departemen.id}
                                href={classes.url(departemen.id)}
                                prefetch
                                className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas/40 p-4 transition-colors hover:border-primary/40 hover:bg-canvas"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="grid size-10 place-items-center rounded-xl bg-surface text-primary">
                                        <Network className="size-5" />
                                    </span>
                                    <div>
                                        <p className="font-semibold text-ink">
                                            {departemen.name}
                                        </p>
                                        <p className="text-xs text-muted">
                                            {departemen.students} murid
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
