import type { MouseEvent } from 'react';

/**
 * Pointer-follow spotlight. Spread the returned handler onto any element with
 * the `spotlight` class; it writes cursor coords into --mx/--my CSS vars.
 */
export function useSpotlight() {
    const onMouseMove = (e: MouseEvent<HTMLElement>) => {
        const el = e.currentTarget;
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        el.style.setProperty('--my', `${e.clientY - rect.top}px`);
    };

    return { onMouseMove };
}
