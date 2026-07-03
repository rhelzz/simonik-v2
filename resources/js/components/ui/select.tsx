import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SelectOption = {
    value: string;
    label: string;
    /** Optional leading node (icon / colored dot) shown before the label. */
    hint?: ReactNode;
};

/**
 * Accessible custom dropdown — replaces the native `<select>` so styling is
 * consistent across browsers (no OS-painted list). Supports keyboard nav,
 * click-outside to close, and a leading icon per option.
 */
export function Select({
    value,
    options,
    onChange,
    placeholder = 'Pilih…',
    icon,
    className,
    ariaLabel,
    name,
    disabled,
}: {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
    icon?: ReactNode;
    className?: string;
    ariaLabel?: string;
    /** When set, a hidden input with this name carries the value inside a form. */
    name?: string;
    disabled?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const rootRef = useRef<HTMLDivElement>(null);

    const selected = options.find((option) => option.value === value);

    function openMenu() {
        setOpen(true);
        setActiveIndex(options.findIndex((o) => o.value === value));
    }

    useEffect(() => {
        if (disabled && open) {
            setOpen(false);
        }
    }, [disabled, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        function onClickOutside(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onClickOutside);

        return () => document.removeEventListener('mousedown', onClickOutside);
    }, [open]);

    function commit(index: number) {
        const option = options[index];

        if (option) {
            onChange(option.value);
        }

        setOpen(false);
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();

            if (!open) {
                openMenu();

                return;
            }

            const dir = event.key === 'ArrowDown' ? 1 : -1;
            setActiveIndex((prev) => {
                const next = prev + dir;

                if (next < 0) {
                    return options.length - 1;
                }

                if (next >= options.length) {
                    return 0;
                }

                return next;
            });
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();

            if (open && activeIndex >= 0) {
                commit(activeIndex);
            } else {
                openMenu();
            }
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
    }

    return (
        <div ref={rootRef} className={cn('relative', className)}>
            {name && <input type="hidden" name={name} value={value} />}
            <button
                type="button"
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label={ariaLabel}
                onClick={() => {
                    if (open) {
                        setOpen(false);
                    } else {
                        openMenu();
                    }
                }}
                onKeyDown={onKeyDown}
                className={cn(
                    'flex w-full items-center gap-2 rounded-xl border bg-canvas/40 px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
                    open
                        ? 'border-primary ring-2 ring-primary/15'
                        : 'border-line hover:border-primary/40',
                )}
            >
                {icon && <span className="shrink-0 text-muted">{icon}</span>}
                <span
                    className={cn(
                        'flex-1 truncate text-left',
                        selected ? 'text-ink' : 'text-muted',
                    )}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        'size-4 shrink-0 text-muted transition-transform',
                        open && 'rotate-180',
                    )}
                />
            </button>

            {open && (
                <ul
                    role="listbox"
                    /* Fixed viewport of ~3 rows (each ~2.75rem incl. gap) + list padding; scroll beyond. */
                    style={{ maxHeight: 'calc(3 * 2.75rem + 0.75rem)' }}
                    className="absolute top-full z-30 mt-2 w-full space-y-0.5 overflow-y-auto rounded-xl border border-line bg-surface p-1.5 shadow-xl shadow-ink/10"
                >
                    {options.map((option, index) => {
                        const isSelected = option.value === value;
                        const isActive = index === activeIndex;

                        return (
                            <li key={option.value}>
                                <button
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    onMouseEnter={() => setActiveIndex(index)}
                                    onClick={() => commit(index)}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                                        isActive
                                            ? 'bg-primary-soft text-primary'
                                            : 'text-ink/80',
                                    )}
                                >
                                    {option.hint && (
                                        <span className="shrink-0">
                                            {option.hint}
                                        </span>
                                    )}
                                    <span className="flex-1 truncate">
                                        {option.label}
                                    </span>
                                    {isSelected && (
                                        <Check className="size-4 shrink-0 text-primary" />
                                    )}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
