import { Zap } from 'lucide-react';
import type { BadgeData } from '@/components/badges/badge-atom';
import { BadgeShowcase } from '@/components/badges/badge-showcase';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type StreakPageProps = {
    streak: { current: number; longest: number };
    stats: { total_journal: number; total_attendance: number };
    badges: BadgeData[];
};

const progressValue = (
    badge: BadgeData,
    streak: StreakPageProps['streak'],
    stats: StreakPageProps['stats'],
): number => {
    if (badge.rule_type === 'streak_journal') {
        return streak.current;
    }

    if (badge.rule_type === 'total_journal') {
        return stats.total_journal;
    }

    if (badge.rule_type === 'total_attendance') {
        return stats.total_attendance;
    }

    return 0;
};

const ruleLabels: Record<string, string> = {
    streak_journal: 'hari berturut-turut',
    total_journal: 'jurnal',
    total_attendance: 'kali hadir',
};

export default function StreakPage({ streak, stats, badges }: StreakPageProps) {
    const unearned = badges.filter((b) => !b.earned);

    return (
        <AppLayout title="Streak & Badge">
            {/* Hero: current + longest streak */}
            <section className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-orange-500/10 p-6 text-center">
                    <span className="text-4xl leading-none">🔥</span>
                    <p className="text-4xl font-extrabold tracking-tight text-orange-600">
                        {streak.current}
                    </p>
                    <p className="text-sm font-medium text-orange-700/80">
                        Streak sekarang
                    </p>
                    <p className="text-xs text-orange-600/60">
                        {streak.current === 0
                            ? 'Tulis jurnal hari ini!'
                            : streak.current === 1
                              ? '1 hari — terus lanjutkan!'
                              : `${streak.current} hari beruntun`}
                    </p>
                </div>

                <div className="flex flex-col items-center justify-center gap-2 rounded-3xl bg-violet-500/10 p-6 text-center">
                    <Zap className="size-9 text-violet-500" />
                    <p className="text-4xl font-extrabold tracking-tight text-violet-600">
                        {streak.longest}
                    </p>
                    <p className="text-sm font-medium text-violet-700/80">
                        Streak terpanjang
                    </p>
                    <p className="text-xs text-violet-600/60">
                        {streak.longest === 0
                            ? 'Belum ada streak'
                            : streak.longest === streak.current
                              ? 'Ini rekor terbaikmu!'
                              : `Rekor ${streak.longest} hari`}
                    </p>
                </div>
            </section>

            {/* Progress toward next badges */}
            {unearned.length > 0 && (
                <section className="mt-5 rounded-3xl bg-surface p-5 sm:p-6">
                    <h3 className="text-base font-bold text-ink">
                        Progress Pencapaian
                    </h3>
                    <p className="mt-0.5 text-sm text-muted">
                        Terus aktif untuk meraih badge berikutnya.
                    </p>

                    <div className="mt-4 space-y-4">
                        {unearned.map((badge) => {
                            const current = progressValue(badge, streak, stats);
                            const target = badge.rule_value;
                            const pct = Math.min(
                                100,
                                Math.round((current / target) * 100),
                            );
                            const label = ruleLabels[badge.rule_type] ?? '';

                            return (
                                <div key={badge.id}>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg leading-none">
                                                {badge.icon}
                                            </span>
                                            <span className="text-sm font-semibold text-ink">
                                                {badge.name}
                                            </span>
                                        </div>
                                        <span className="shrink-0 text-xs text-muted">
                                            {current}/{target} {label}
                                        </span>
                                    </div>
                                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted/20">
                                        <div
                                            className={cn(
                                                'h-full rounded-full transition-all duration-500',
                                                pct >= 100
                                                    ? 'bg-positive'
                                                    : pct >= 60
                                                      ? 'bg-primary'
                                                      : 'bg-muted/50',
                                            )}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Badge showcase */}
            <section className="mt-5">
                <BadgeShowcase badges={badges} />
            </section>
        </AppLayout>
    );
}
