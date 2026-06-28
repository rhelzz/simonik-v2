import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Heading2,
    Italic,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Strikethrough,
    Undo2,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { proseClass } from '@/components/ui/rich-text';

/**
 * Word-like rich-text editor (Tiptap) for the activity journal description.
 * Emits sanitized-on-render HTML via `onChange`.
 */
export function RichTextEditor({
    value,
    onChange,
}: {
    value: string;
    onChange: (html: string) => void;
}) {
    const editor = useEditor({
        extensions: [StarterKit],
        content: value,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: cn(
                    proseClass,
                    'min-h-40 px-4 py-3 focus:outline-none',
                ),
            },
        },
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-xl border border-line bg-canvas/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <div className="flex flex-wrap items-center gap-1 border-b border-line bg-surface px-2 py-1.5">
                <ToolbarButton
                    icon={Bold}
                    label="Tebal"
                    active={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarButton
                    icon={Italic}
                    label="Miring"
                    active={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarButton
                    icon={Strikethrough}
                    label="Coret"
                    active={editor.isActive('strike')}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                />
                <span className="mx-1 h-5 w-px bg-line" />
                <ToolbarButton
                    icon={Heading2}
                    label="Judul"
                    active={editor.isActive('heading', { level: 2 })}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                />
                <ToolbarButton
                    icon={List}
                    label="Daftar"
                    active={editor.isActive('bulletList')}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                />
                <ToolbarButton
                    icon={ListOrdered}
                    label="Daftar bernomor"
                    active={editor.isActive('orderedList')}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                />
                <ToolbarButton
                    icon={Quote}
                    label="Kutipan"
                    active={editor.isActive('blockquote')}
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                />
                <span className="mx-1 h-5 w-px bg-line" />
                <ToolbarButton
                    icon={Undo2}
                    label="Urungkan"
                    disabled={!editor.can().undo()}
                    onClick={() => editor.chain().focus().undo().run()}
                />
                <ToolbarButton
                    icon={Redo2}
                    label="Ulangi"
                    disabled={!editor.can().redo()}
                    onClick={() => editor.chain().focus().redo().run()}
                />
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}



function ToolbarButton({
    icon: Icon,
    label,
    active = false,
    disabled = false,
    onClick,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={active}
            title={label}
            className={cn(
                'grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40',
                active && 'bg-primary-soft text-primary',
            )}
        >
            <Icon className="size-4" />
        </button>
    );
}
