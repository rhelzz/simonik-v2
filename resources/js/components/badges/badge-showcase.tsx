import { Trophy } from 'lucide-react';
import type { BadgeData } from './badge-atom';
import { BadgeCard } from './badge-card';

type BadgeShowcaseProps = {
    badges: BadgeData[];
};

export function BadgeShowcase({ badges }: BadgeShowcaseProps) {
    const earned = badges.filter((b) => b.earned);
    const locked = badges.filter((b) => !b.earned);

    if (badges.length === 0) {
        return (
            <div className="rounded-3xl bg-surface p-6 text-center">
                <p className="text-sm text-muted">Belum ada badge tersedia.</p>
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="flex items-center gap-2">
                <Trophy className="size-5 text-amber-500" />
                <h3 className="text-base font-bold text-ink">
                    Badge & Pencapaian
                </h3>
                {earned.length > 0 && (
                    <span className="ml-auto rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                        {earned.length}/{badges.length} diraih
                    </span>
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {/* Earned badges first */}
                {earned.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                ))}
                {/* Locked badges */}
                {locked.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                ))}
            </div>
        </div>
    );
}
