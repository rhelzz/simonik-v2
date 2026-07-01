import { cn } from '@/lib/utils';

export type BadgeData = {
    id: number;
    key: string;
    name: string;
    description: string | null;
    icon: string;
    color: string;
    rule_type: string;
    rule_value: number;
    earned: boolean;
    awarded_at: string | null;
};

type BadgeAtomProps = {
    badge: BadgeData;
    size?: 'sm' | 'md';
};

export function BadgeAtom({ badge, size = 'md' }: BadgeAtomProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 rounded-full font-semibold',
                size === 'sm'
                    ? 'px-2.5 py-1 text-xs'
                    : 'px-3 py-1.5 text-sm',
                badge.earned
                    ? badge.color
                    : 'bg-muted/20 text-muted/60',
            )}
            title={badge.description ?? badge.name}
        >
            <span
                className={cn(
                    'leading-none',
                    !badge.earned && 'opacity-40 grayscale',
                )}
            >
                {badge.icon}
            </span>
            {badge.name}
        </span>
    );
}
