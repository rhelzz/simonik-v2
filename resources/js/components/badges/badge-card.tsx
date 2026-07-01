import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BadgeData } from './badge-atom';

type BadgeCardProps = {
    badge: BadgeData;
};

const ruleLabels: Record<string, string> = {
    streak_journal: 'hari berturut-turut',
    total_journal: 'jurnal',
    total_attendance: 'kali hadir',
};

export function BadgeCard({ badge }: BadgeCardProps) {
    const ruleLabel = ruleLabels[badge.rule_type] ?? '';

    return (
        <div
            className={cn(
                'flex flex-col gap-3 rounded-2xl border p-4 transition-shadow',
                badge.earned
                    ? 'border-transparent bg-surface shadow-sm'
                    : 'border-dashed border-muted/30 bg-surface/50',
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <span
                    className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl text-xl',
                        badge.earned ? badge.color : 'bg-muted/10 opacity-40 grayscale',
                    )}
                >
                    {badge.icon}
                </span>
                {!badge.earned && (
                    <Lock className="mt-0.5 size-4 shrink-0 text-muted/50" />
                )}
            </div>

            <div>
                <p
                    className={cn(
                        'text-sm font-bold',
                        badge.earned ? 'text-ink' : 'text-muted/60',
                    )}
                >
                    {badge.name}
                </p>
                <p className="mt-0.5 text-xs text-muted">
                    {badge.description ?? `${badge.rule_value} ${ruleLabel}`}
                </p>
            </div>

            {badge.earned && badge.awarded_at ? (
                <p className="text-xs font-medium text-positive">
                    ✓ Diraih{' '}
                    {new Date(badge.awarded_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                    })}
                </p>
            ) : (
                <p className="text-xs text-muted/60">
                    Syarat: {badge.rule_value} {ruleLabel}
                </p>
            )}
        </div>
    );
}
