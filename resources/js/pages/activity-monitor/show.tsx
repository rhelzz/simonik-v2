import { Link, router } from '@inertiajs/react';
import { ArrowLeft, BadgeCheck, Clock, RotateCcw } from 'lucide-react';
import {
    index,
    verify,
} from '@/actions/App/Http/Controllers/ActivityMonitorController';
import { RichText } from '@/components/ui/rich-text';
import { AppLayout } from '@/layouts/app-layout';

type MonitorActivity = {
    id: number;
    judul: string;
    date: string;
    start_time: string;
    end_time: string;
    description: string;
    tools: string;
    image: string | null;
    verified: boolean;
    student: string | null;
    class: string | null;
    industry: string | null;
};

type MonitorShowProps = {
    activity: MonitorActivity;
    can: { verify: boolean };
};

export default function ActivityMonitorShow({
    activity,
    can,
}: MonitorShowProps) {
    function setVerified(value: boolean) {
        router.patch(
            verify.url(activity.id),
            { verified: value },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout title="Detail Jurnal">
            <div className="space-y-5">
                <Link
                    href={index.url()}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-ink/70 transition-colors hover:text-primary"
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke daftar
                </Link>

                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-ink">
                                {activity.judul}
                            </h2>
                            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                                <span>{activity.date}</span>
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="size-3.5" />
                                    {activity.start_time}–{activity.end_time}
                                </span>
                                <span>· {activity.tools}</span>
                            </p>
                        </div>
                        {activity.verified ? (
                            <span className="inline-flex h-fit items-center gap-1 rounded-full bg-positive/15 px-3 py-1 text-xs font-semibold text-positive">
                                <BadgeCheck className="size-3.5" />
                                Terverifikasi
                            </span>
                        ) : (
                            <span className="inline-flex h-fit rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-muted">
                                Belum diverifikasi
                            </span>
                        )}
                    </div>

                    <dl className="grid gap-4 py-4 sm:grid-cols-3">
                        <Meta label="Siswa" value={activity.student} />
                        <Meta label="Kelas" value={activity.class} />
                        <Meta label="Industri" value={activity.industry} />
                    </dl>

                    <div className="py-2">
                        <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                            Uraian kegiatan
                        </h3>
                        <RichText html={activity.description} />
                    </div>

                    {activity.image && (
                        <div className="pt-4">
                            <h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                                Foto
                            </h3>
                            <img
                                src={activity.image}
                                alt={`Foto kegiatan ${activity.judul}`}
                                className="max-h-80 rounded-2xl border border-line object-contain"
                            />
                        </div>
                    )}

                    {can.verify && (
                        <div className="mt-5 flex justify-end border-t border-line pt-4">
                            {activity.verified ? (
                                <button
                                    type="button"
                                    onClick={() => setVerified(false)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                                >
                                    <RotateCcw className="size-4" />
                                    Batalkan verifikasi
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setVerified(true)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                                >
                                    <BadgeCheck className="size-4" />
                                    Verifikasi jurnal
                                </button>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

function Meta({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <dt className="text-xs font-semibold tracking-[0.12em] text-muted uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-ink">
                {value ?? '—'}
            </dd>
        </div>
    );
}
