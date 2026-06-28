import type { ComponentType } from 'react';
import type { Auth, Role } from './auth';

export type * from './auth';

/**
 * Props shared on every Inertia page via HandleInertiaRequests::share().
 */
export type SharedData = {
    name: string;
    auth: Auth;
    flash: { success: string | null; error: string | null };
    [key: string]: unknown;
};

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

/**
 * Shape of a Laravel length-aware paginator serialized to Inertia.
 */
export type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

/**
 * A single sidebar navigation entry. `href` is omitted for features that
 * are not built yet (rendered as "coming soon"). `roles` limits visibility;
 * omit to show for every role.
 */
export type NavItem = {
    label: string;
    icon: ComponentType<{ className?: string }>;
    href?: string;
    roles?: Role[];
};

export type NavSection = {
    title: string;
    items: NavItem[];
};
