import { Link, router } from '@inertiajs/react';
import {
    Award,
    Building2,
    FileImage,
    Globe,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import {
    create,
    destroy,
    edit,
    toggleGlobal,
} from '@/actions/App/Http/Controllers/CertificateTemplateController';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

type Scope = 'global' | 'individual' | 'industry';

type TemplateRow = {
    id: number;
    name: string;
    background: string | null;
    anchorCount: number;
    scope: Scope;
};

const scopeBadge: Record<Scope, { label: string; icon: typeof Globe }> = {
    global: { label: 'Global', icon: Globe },
    individual: { label: 'Prestasi', icon: Award },
    industry: { label: 'Industri', icon: Building2 },
};

export default function CertificateTemplatesIndex({
    templates,
    canToggleGlobal,
}: {
    templates: TemplateRow[];
    canToggleGlobal: boolean;
}) {
    function toggle(template: TemplateRow) {
        const message =
            template.scope === 'global'
                ? `Matikan status global "${template.name}"? Sertifikat yang sudah terbit tidak akan terhapus.`
                : `Jadikan "${template.name}" global? Sertifikat ini akan langsung tertera ke semua siswa.`;

        if (confirm(message)) {
            router.post(
                toggleGlobal.url(template.id),
                {},
                { preserveScroll: true },
            );
        }
    }

    function remove(template: TemplateRow) {
        if (confirm(`Hapus template "${template.name}"?`)) {
            router.delete(destroy.url(template.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Template Sertifikat">
            <section className="rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-base font-bold text-ink">
                            Template sertifikat
                        </h2>
                        <p className="text-sm text-muted">
                            {templates.length} template · global otomatis
                            tertera ke semua siswa, industri hanya untuk siswa
                            magang di sana
                        </p>
                    </div>
                    <Link
                        href={create.url()}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                    >
                        <Plus className="size-4" />
                        Tambah template
                    </Link>
                </div>

                {templates.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <FileImage className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Belum ada template
                        </p>
                        <p className="text-xs text-muted">
                            Unggah gambar latar lalu atur posisi teks.
                        </p>
                    </div>
                ) : (
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {templates.map((template) => {
                            const badge = scopeBadge[template.scope];
                            const BadgeIcon = badge.icon;

                            return (
                                <article
                                    key={template.id}
                                    className={cn(
                                        'overflow-hidden rounded-2xl border bg-canvas/30',
                                        template.scope === 'global'
                                            ? 'border-primary'
                                            : 'border-line',
                                    )}
                                >
                                    <div className="aspect-[1.414/1] w-full overflow-hidden bg-canvas">
                                        {template.background && (
                                            <img
                                                src={template.background}
                                                alt={template.name}
                                                className="size-full object-cover"
                                            />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-semibold text-ink">
                                                {template.name}
                                            </h3>
                                            <span
                                                className={cn(
                                                    'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                                                    template.scope === 'global'
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-canvas text-muted',
                                                )}
                                            >
                                                <BadgeIcon className="size-3.5" />
                                                {badge.label}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-muted">
                                            {template.anchorCount} anchor teks
                                        </p>

                                        <div className="mt-3 flex items-center gap-2">
                                            {canToggleGlobal &&
                                                template.scope !==
                                                    'industry' && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggle(template)
                                                        }
                                                        className={cn(
                                                            'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                                                            template.scope ===
                                                                'global'
                                                                ? 'text-muted hover:bg-canvas'
                                                                : 'bg-primary-soft text-primary hover:bg-primary/15',
                                                        )}
                                                    >
                                                        {template.scope ===
                                                        'global'
                                                            ? 'Matikan global'
                                                            : 'Jadikan global'}
                                                    </button>
                                                )}
                                            <Link
                                                href={edit.url(template.id)}
                                                className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-canvas hover:text-primary"
                                                aria-label={`Edit ${template.name}`}
                                            >
                                                <Pencil className="size-4" />
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => remove(template)}
                                                className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-500"
                                                aria-label={`Hapus ${template.name}`}
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </AppLayout>
    );
}
