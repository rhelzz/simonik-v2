import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

/**
 * Tailwind styling for rendered rich-text HTML. Shared by the read-only
 * renderer and the Tiptap editor's editable area so both look identical.
 */
export const proseClass = cn(
    'text-sm leading-relaxed text-ink',
    '[&_p]:my-2 [&_strong]:font-semibold [&_em]:italic [&_s]:line-through',
    '[&_h1]:my-3 [&_h1]:text-xl [&_h1]:font-bold',
    '[&_h2]:my-3 [&_h2]:text-lg [&_h2]:font-bold',
    '[&_h3]:my-2 [&_h3]:text-base [&_h3]:font-semibold',
    '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5',
    '[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-line [&_blockquote]:pl-3 [&_blockquote]:text-muted',
    '[&_code]:rounded [&_code]:bg-canvas [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs',
    '[&_a]:text-primary [&_a]:underline',
);

/**
 * Render untrusted rich-text HTML safely. The HTML is sanitized with DOMPurify
 * before it is injected, so stored journal content cannot run scripts.
 */
export function RichText({
    html,
    className,
}: {
    html: string | null;
    className?: string;
}) {
    const clean = DOMPurify.sanitize(html ?? '');

    return (
        <div
            className={cn(proseClass, className)}
            dangerouslySetInnerHTML={{ __html: clean }}
        />
    );
}
