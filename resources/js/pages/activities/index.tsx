import { Link, router } from '@inertiajs/react';
import {
    Clock,
    Eye,
    NotebookPen,
    Pencil,
    Plus,
    Trash2,
    Wrench,
    Zap,
} from 'lucide-react';
import { useState } from 'react';
import {
    create,
    destroy,
    edit,
} from '@/actions/App/Http/Controllers/ActivityController';
import type { BadgeData } from '@/components/badges/badge-atom';
import { BadgeShowcase } from '@/components/badges/badge-showcase';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { RichText } from '@/components/ui/rich-text';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type Activity = {
    id: number;
    judul: string;
    date: string;
    dateLabel: string;
    start_time: string;
    end_time: string;
    description: string;
    tools: string;
    image: string | null;
    verified: boolean;
};

export default function ActivitiesIndex({
    activities,
    streak,
    badges,
}: {
    activities: Paginated<Activity>;
    streak: { current: number; longest: number };
    badges: BadgeData[];
}) {
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
        null,
    );

    function remove(activity: Activity) {
        if (confirm(`Hapus jurnal "${activity.judul}"?`)) {
            router.delete(destroy.url(activity.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Jurnal Saya">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Jurnal kegiatan harian
                        </h2>
                        <p className="text-sm text-muted">
                            {activities.total} jurnal tercatat
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tulis jurnal
                    </Link>
                </div>

                {/* Streak motivational banner */}
                <div
                    className={cn(
                        'mt-4 flex items-center gap-3 rounded-2xl px-4 py-3',
                        streak.current > 0
                            ? 'bg-orange-500/10'
                            : 'bg-muted/10',
                    )}
                >
                    <span className="text-2xl leading-none">
                        {streak.current > 0 ? '🔥' : '📝'}
                    </span>
                    {streak.current > 0 ? (
                        <div>
                            <p className="text-sm font-bold text-orange-700 dark:text-orange-400">
                                {streak.current} hari berturut-turut!
                            </p>
                            <p className="text-xs text-orange-600/70 dark:text-orange-500/70">
                                {streak.longest > streak.current ? (
                                    <>
                                        Rekor terbaikmu:{' '}
                                        <span className="font-semibold">
                                            {streak.longest} hari
                                        </span>
                                        . Terus pertahankan!
                                    </>
                                ) : (
                                    <>
                                        Ini adalah rekor streak terbaikmu!{' '}
                                        <Zap className="inline size-3" />
                                    </>
                                )}
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-muted">
                            Tulis jurnal hari ini untuk memulai streak
                            harianmu!
                        </p>
                    )}
                </div>

                {activities.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <NotebookPen className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada jurnal
                        </p>
                        <p className="text-xs text-muted">
                            Mulai catat kegiatan PKL harianmu.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 space-y-3">
                        {activities.data.map((activity) => (
                            <article
                                key={activity.id}
                                className="rounded-2xl border border-line bg-canvas/30 p-4"
                            >
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-ink">
                                            {activity.judul}
                                        </h3>
                                        <p className="text-xs text-muted">
                                            {activity.dateLabel}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Clock className="size-3.5" />
                                        {activity.start_time} –{' '}
                                        {activity.end_time}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Wrench className="size-3.5" />
                                        {activity.tools}
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedActivity(activity)
                                        }
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-ink/75 transition-colors hover:bg-canvas"
                                    >
                                        <Eye className="size-4" />
                                        Detail
                                    </button>
                                    <Link
                                        href={edit.url(activity.id)}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-primary transition-colors hover:bg-canvas"
                                    >
                                        <Pencil className="size-4" />
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => remove(activity)}
                                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                                    >
                                        <Trash2 className="size-4" />
                                        Hapus
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                <Pagination meta={activities} />
            </section>

            {badges.length > 0 && (
                <section className="mt-5">
                    <BadgeShowcase badges={badges} />
                </section>
            )}

            <Modal
                open={!!selectedActivity}
                onClose={() => setSelectedActivity(null)}
                title="Detail Jurnal"
            >
                {selectedActivity && (
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-base font-bold text-ink">
                                {selectedActivity.judul}
                            </h3>
                            <p className="mt-1 text-xs text-muted">
                                {selectedActivity.dateLabel}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 border-y border-line py-2 text-xs text-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <Clock className="size-3.5" />
                                {selectedActivity.start_time} –{' '}
                                {selectedActivity.end_time}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Wrench className="size-3.5" />
                                {selectedActivity.tools}
                            </span>
                        </div>

                        {selectedActivity.image && (
                            <div className="mt-3">
                                <img
                                    src={selectedActivity.image}
                                    alt={`Foto kegiatan ${selectedActivity.judul}`}
                                    className="aspect-video w-full rounded-xl border border-line object-cover"
                                />
                            </div>
                        )}

                        <div className="mt-3 max-h-[35vh] overflow-y-auto pr-1 text-sm text-ink/90">
                            <RichText html={selectedActivity.description} />
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedActivity(null)}
                                className="rounded-xl bg-canvas px-4 py-2 text-sm font-semibold text-ink/70 transition-colors hover:bg-line"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AppLayout>
    );
}
