import { router, useForm } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    ChevronDown,
    Download,
    Eye,
    FileText,
    Image as ImageIcon,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/GuideController';
import { Modal } from '@/components/ui/modal';
import { RichText } from '@/components/ui/rich-text';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

export type GuideRow = {
    id: number;
    judul: string;
    kategori: string | null;
    deskripsi: string | null;
    konten: string | null;
    gambar: string | null;
    dokumen: string | null;
    status: 'draft' | 'published';
    urutan: number;
    published_at: string | null;
    publishedAtFormatted: string | null;
    type: string | null;
    size: string | null;
    uploadedAt: string | null;
};

type Props = {
    guides: GuideRow[];
    categories?: string[];
    can: { manage: boolean };
};

type GuideFormData = {
    judul: string;
    kategori: string;
    deskripsi: string;
    konten: string;
    status: 'draft' | 'published';
    urutan: number | string;
    published_at: string;
    gambar: File | null;
    dokumen: File | null;
    hapus_gambar: boolean;
    hapus_dokumen: boolean;
};

const inputClass =
    'w-full rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none';

const CATEGORY_SUGGESTIONS = [
    'Administrasi',
    'Jurnal & Presensi',
    'Pelaksanaan PKL',
    'Laporan & Sidang',
    'Tata Tertib',
    'Umum',
];

export default function GuidesIndex({ guides, categories = [], can }: Props) {
    const [openFormModal, setOpenFormModal] = useState(false);
    const [editing, setEditing] = useState<GuideRow | null>(null);
    const [readingGuide, setReadingGuide] = useState<GuideRow | null>(null);

    // Accordion state: set of open guide IDs. By default, first guide is open if exists.
    const [openAccordionIds, setOpenAccordionIds] = useState<number[]>(() =>
        guides.length > 0 ? [guides[0].id] : [],
    );

    // Filter & Search states
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const form = useForm<GuideFormData>({
        judul: '',
        kategori: '',
        deskripsi: '',
        konten: '',
        status: 'published',
        urutan: 0,
        published_at: new Date().toISOString().slice(0, 10),
        gambar: null,
        dokumen: null,
        hapus_gambar: false,
        hapus_dokumen: false,
    });

    const filteredGuides = useMemo(() => {
        return guides.filter((g) => {
            const matchesCategory =
                selectedCategory === 'all' ||
                (g.kategori || '').toLowerCase() ===
                    selectedCategory.toLowerCase();

            const query = searchQuery.trim().toLowerCase();
            const matchesQuery =
                query === '' ||
                g.judul.toLowerCase().includes(query) ||
                (g.kategori && g.kategori.toLowerCase().includes(query)) ||
                (g.deskripsi && g.deskripsi.toLowerCase().includes(query)) ||
                (g.konten && g.konten.toLowerCase().includes(query));

            return matchesCategory && matchesQuery;
        });
    }, [guides, selectedCategory, searchQuery]);

    const allCategories = useMemo(() => {
        const set = new Set<string>();
        categories.forEach((c) => c && set.add(c));
        guides.forEach((g) => g.kategori && set.add(g.kategori));

        return Array.from(set);
    }, [categories, guides]);

    function toggleAccordion(id: number) {
        setOpenAccordionIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id],
        );
    }

    function expandAll() {
        setOpenAccordionIds(filteredGuides.map((g) => g.id));
    }

    function collapseAll() {
        setOpenAccordionIds([]);
    }

    function closeForm() {
        setOpenFormModal(false);
        form.reset();
        form.clearErrors();
        setEditing(null);
    }

    function openCreate() {
        form.reset();
        form.setData({
            judul: '',
            kategori: '',
            deskripsi: '',
            konten: '',
            status: 'published',
            urutan:
                guides.length > 0
                    ? Math.max(...guides.map((g) => g.urutan)) + 1
                    : 0,
            published_at: new Date().toISOString().slice(0, 10),
            gambar: null,
            dokumen: null,
            hapus_gambar: false,
            hapus_dokumen: false,
        });
        form.clearErrors();
        setEditing(null);
        setOpenFormModal(true);
    }

    function openEdit(guide: GuideRow) {
        form.setData({
            judul: guide.judul,
            kategori: guide.kategori ?? '',
            deskripsi: guide.deskripsi ?? '',
            konten: guide.konten ?? '',
            status: guide.status ?? 'published',
            urutan: guide.urutan ?? 0,
            published_at:
                guide.published_at ?? new Date().toISOString().slice(0, 10),
            gambar: null,
            dokumen: null,
            hapus_gambar: false,
            hapus_dokumen: false,
        });
        form.clearErrors();
        setEditing(guide);
        setOpenFormModal(true);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const options = {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: closeForm,
        };

        if (editing) {
            form.transform((data) => ({ ...data, _method: 'put' }));
            form.post(update.url(editing.id), options);
        } else {
            form.transform((data) => data);
            form.post(store.url(), options);
        }
    }

    function remove(guide: GuideRow) {
        if (confirm(`Hapus panduan "${guide.judul}"?`)) {
            router.delete(destroy.url(guide.id), { preserveScroll: true });
        }
    }

    return (
        <AppLayout title="Panduan PKL">
            <section className="space-y-6">
                {/* Header Card */}
                <div className="rounded-3xl border border-line bg-surface p-5 shadow-xs sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                                <BookOpen className="size-6" />
                            </span>
                            <div>
                                <h1 className="text-lg font-bold text-ink">
                                    Panduan PKL
                                </h1>
                                <p className="text-sm text-muted">
                                    Pedoman, instruksi teknis, dan dokumen
                                    pelaksanaan PKL
                                </p>
                            </div>
                        </div>

                        {can.manage && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
                            >
                                <Plus className="size-4" />
                                Tambah panduan
                            </button>
                        )}
                    </div>

                    {/* Filter, Search & Accordion Controls */}
                    <div className="mt-6 flex flex-col gap-3 border-t border-line/60 pt-5 md:flex-row md:items-center md:justify-between">
                        {/* Search Input */}
                        <div className="relative max-w-md flex-1">
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari artikel atau topik panduan…"
                                className="w-full rounded-xl border border-line bg-canvas/50 py-2 pr-8 pl-10 text-sm text-ink placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted hover:text-ink"
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>

                        {/* Expand/Collapse Toggle Actions */}
                        {filteredGuides.length > 0 && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                                <button
                                    type="button"
                                    onClick={expandAll}
                                    className="rounded-lg px-2.5 py-1.5 transition-colors hover:bg-canvas hover:text-ink"
                                >
                                    Buka Semua
                                </button>
                                <span>·</span>
                                <button
                                    type="button"
                                    onClick={collapseAll}
                                    className="rounded-lg px-2.5 py-1.5 transition-colors hover:bg-canvas hover:text-ink"
                                >
                                    Tutup Semua
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Category Filter Pills */}
                    {allCategories.length > 0 && (
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                className={cn(
                                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
                                    selectedCategory === 'all'
                                        ? 'bg-primary text-white shadow-xs'
                                        : 'bg-canvas text-muted hover:bg-primary-soft hover:text-primary',
                                )}
                            >
                                Semua Kategori
                            </button>
                            {allCategories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        'rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors',
                                        selectedCategory === cat
                                            ? 'bg-primary text-white shadow-xs'
                                            : 'bg-canvas text-muted hover:bg-primary-soft hover:text-primary',
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Empty State */}
                {filteredGuides.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-surface p-12 text-center">
                        <span className="grid size-14 place-items-center rounded-2xl bg-canvas text-muted">
                            <BookOpen className="size-7" />
                        </span>
                        <div>
                            <p className="text-base font-semibold text-ink">
                                Belum ada artikel panduan
                            </p>
                            <p className="mt-1 text-sm text-muted">
                                {searchQuery || selectedCategory !== 'all'
                                    ? 'Tidak ada panduan yang cocok dengan filter pencarian.'
                                    : 'Panduan PKL akan segera dipublikasikan di sini.'}
                            </p>
                        </div>
                        {can.manage && (
                            <button
                                type="button"
                                onClick={openCreate}
                                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                            >
                                <Plus className="size-4" />
                                Tambah Panduan Sekarang
                            </button>
                        )}
                    </div>
                ) : (
                    /* Accordion Cards Container */
                    <div className="space-y-3">
                        {filteredGuides.map((guide) => {
                            const isOpen = openAccordionIds.includes(guide.id);

                            return (
                                <article
                                    key={guide.id}
                                    className={cn(
                                        'overflow-hidden rounded-3xl border transition-all duration-200',
                                        isOpen
                                            ? 'border-primary/40 bg-surface shadow-sm ring-1 ring-primary/20'
                                            : 'border-line bg-surface/90 hover:border-line hover:bg-surface',
                                    )}
                                >
                                    {/* Accordion Header / Summary button */}
                                    <button
                                        type="button"
                                        onClick={() =>
                                            toggleAccordion(guide.id)
                                        }
                                        className="flex w-full items-start justify-between gap-4 p-5 text-left focus:outline-none"
                                        aria-expanded={isOpen}
                                    >
                                        <div className="flex min-w-0 flex-1 items-start gap-3.5">
                                            <span
                                                className={cn(
                                                    'grid size-10 shrink-0 place-items-center rounded-2xl transition-colors',
                                                    isOpen
                                                        ? 'bg-primary text-white shadow-xs'
                                                        : 'bg-canvas text-primary',
                                                )}
                                            >
                                                <FileText className="size-5" />
                                            </span>

                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                {/* Meta Pills */}
                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    {guide.kategori && (
                                                        <span className="rounded-lg bg-primary-soft px-2.5 py-0.5 font-semibold text-primary">
                                                            {guide.kategori}
                                                        </span>
                                                    )}
                                                    {can.manage && (
                                                        <>
                                                            <span
                                                                className={cn(
                                                                    'rounded-lg px-2.5 py-0.5 font-semibold',
                                                                    guide.status ===
                                                                        'published'
                                                                        ? 'bg-emerald-500/10 text-emerald-600'
                                                                        : 'bg-amber-500/10 text-amber-600',
                                                                )}
                                                            >
                                                                {guide.status ===
                                                                'published'
                                                                    ? 'Tayang'
                                                                    : 'Draf'}
                                                            </span>
                                                            <span className="text-muted">
                                                                Urutan #
                                                                {guide.urutan}
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 text-muted">
                                                        <Calendar className="size-3.5" />
                                                        {guide.publishedAtFormatted ??
                                                            guide.uploadedAt ??
                                                            'Terbaru'}
                                                    </span>
                                                    {guide.dokumen && (
                                                        <span className="rounded-md border border-line bg-canvas px-2 py-0.5 font-medium text-muted">
                                                            PDF / Berkas
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h2 className="text-base font-bold text-ink">
                                                    {guide.judul}
                                                </h2>

                                                {/* Short Preview (when collapsed) */}
                                                {!isOpen && guide.deskripsi && (
                                                    <p className="line-clamp-1 text-sm text-muted">
                                                        {guide.deskripsi}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <span
                                            className={cn(
                                                'grid size-8 shrink-0 place-items-center rounded-xl bg-canvas text-muted transition-transform duration-200',
                                                isOpen &&
                                                    'rotate-180 text-primary',
                                            )}
                                        >
                                            <ChevronDown className="size-4" />
                                        </span>
                                    </button>

                                    {/* Accordion Body */}
                                    {isOpen && (
                                        <div className="border-t border-line/60 bg-canvas/30 px-5 py-4 sm:px-6">
                                            {/* Optional Image Preview in Card */}
                                            {guide.gambar && (
                                                <div className="mb-4 max-h-56 overflow-hidden rounded-2xl border border-line bg-surface">
                                                    <img
                                                        src={guide.gambar}
                                                        alt={guide.judul}
                                                        className="h-56 w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                            )}

                                            {/* Deskripsi / Ringkasan */}
                                            {guide.deskripsi && (
                                                <p className="text-sm leading-relaxed font-medium text-ink/80">
                                                    {guide.deskripsi}
                                                </p>
                                            )}

                                            {/* Supporting Document Download Button (if present) */}
                                            {guide.dokumen && (
                                                <div className="mt-3 flex items-center justify-between rounded-2xl border border-line bg-surface p-3 sm:p-4">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                                                            <FileText className="size-4" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-semibold text-ink">
                                                                Dokumen Lampiran
                                                            </p>
                                                            <p className="text-xs text-muted">
                                                                {guide.type ??
                                                                    'PDF'}
                                                                {guide.size
                                                                    ? ` · ${guide.size}`
                                                                    : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={guide.dokumen}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-soft px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                                                    >
                                                        <Download className="size-3.5" />
                                                        Unduh
                                                    </a>
                                                </div>
                                            )}

                                            {/* Card Action Footer */}
                                            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/50 pt-3">
                                                {/* Primary Button to open reading modal */}
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setReadingGuide(guide)
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover"
                                                >
                                                    <Eye className="size-4" />
                                                    Baca Panduan Lengkap
                                                </button>

                                                {/* Admin Manage Actions */}
                                                {can.manage && (
                                                    <div className="flex items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEdit(guide)
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary/40 hover:text-primary"
                                                        >
                                                            <Pencil className="size-3.5" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                remove(guide)
                                                            }
                                                            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            Hapus
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* MODAL 1: BACA ISI PANDUAN LENGKAP */}
            {readingGuide && (
                <Modal
                    open={Boolean(readingGuide)}
                    onClose={() => setReadingGuide(null)}
                    title={readingGuide.judul}
                    maxWidth="max-w-3xl"
                >
                    <div className="space-y-5">
                        {/* Meta info */}
                        <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs text-muted">
                            {readingGuide.kategori && (
                                <span className="rounded-lg bg-primary-soft px-2.5 py-1 font-semibold text-primary">
                                    {readingGuide.kategori}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="size-3.5" />
                                Diperbarui:{' '}
                                {readingGuide.publishedAtFormatted ??
                                    readingGuide.uploadedAt}
                            </span>
                        </div>

                        {/* Banner Image */}
                        {readingGuide.gambar && (
                            <div className="overflow-hidden rounded-2xl border border-line bg-canvas">
                                <img
                                    src={readingGuide.gambar}
                                    alt={readingGuide.judul}
                                    className="max-h-96 w-full bg-canvas object-contain"
                                />
                            </div>
                        )}

                        {/* Deskripsi highlight */}
                        {readingGuide.deskripsi && (
                            <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 text-sm leading-relaxed font-medium text-ink">
                                {readingGuide.deskripsi}
                            </div>
                        )}

                        {/* Rich Text Content */}
                        {readingGuide.konten ? (
                            <div className="pt-2">
                                <RichText html={readingGuide.konten} />
                            </div>
                        ) : !readingGuide.deskripsi ? (
                            <p className="text-sm text-muted italic">
                                Tidak ada rincian artikel tambahan. Silakan
                                unduh dokumen pendukung di bawah ini.
                            </p>
                        ) : null}

                        {/* Supporting PDF / Office document */}
                        {readingGuide.dokumen && (
                            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/60 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-3">
                                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-white">
                                        <FileText className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-ink">
                                            Dokumen Pendukung
                                        </p>
                                        <p className="text-xs text-muted">
                                            Format {readingGuide.type ?? 'PDF'}
                                            {readingGuide.size
                                                ? ` · ${readingGuide.size}`
                                                : ''}
                                        </p>
                                    </div>
                                </div>
                                <a
                                    href={readingGuide.dokumen}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-primary-hover"
                                >
                                    <Download className="size-4" />
                                    Unduh Dokumen
                                </a>
                            </div>
                        )}

                        {/* Close button */}
                        <div className="flex justify-end border-t border-line pt-3">
                            <button
                                type="button"
                                onClick={() => setReadingGuide(null)}
                                className="rounded-xl bg-canvas px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-line/40"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL 2: FORM TAMBAH / EDIT PANDUAN (Admin & Kaprog) */}
            {can.manage && (
                <Modal
                    open={openFormModal}
                    onClose={closeForm}
                    title={
                        editing
                            ? 'Edit Artikel Panduan'
                            : 'Tambah Artikel Panduan'
                    }
                    maxWidth="max-w-2xl"
                >
                    <form onSubmit={submit} className="space-y-4">
                        {/* Judul */}
                        <Field
                            label="Judul Panduan *"
                            htmlFor="judul"
                            error={form.errors.judul}
                        >
                            <input
                                id="judul"
                                value={form.data.judul}
                                onChange={(e) =>
                                    form.setData('judul', e.target.value)
                                }
                                placeholder="mis. Panduan Pengisian Jurnal Harian PKL"
                                className={inputClass}
                                autoFocus
                            />
                        </Field>

                        {/* Kategori & Urutan */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                label="Kategori"
                                htmlFor="kategori"
                                error={form.errors.kategori}
                            >
                                <input
                                    id="kategori"
                                    list="kategori-list"
                                    value={form.data.kategori}
                                    onChange={(e) =>
                                        form.setData('kategori', e.target.value)
                                    }
                                    placeholder="mis. Administrasi / Jurnal"
                                    className={inputClass}
                                />
                                <datalist id="kategori-list">
                                    {CATEGORY_SUGGESTIONS.map((cat) => (
                                        <option key={cat} value={cat} />
                                    ))}
                                </datalist>
                            </Field>

                            <Field
                                label="Urutan Tampil"
                                htmlFor="urutan"
                                error={form.errors.urutan}
                            >
                                <input
                                    id="urutan"
                                    type="number"
                                    min={0}
                                    value={form.data.urutan}
                                    onChange={(e) =>
                                        form.setData(
                                            'urutan',
                                            parseInt(e.target.value, 10) || 0,
                                        )
                                    }
                                    placeholder="0"
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        {/* Status & Tanggal Pembaruan */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field
                                label="Status Publikasi"
                                htmlFor="status"
                                error={form.errors.status}
                            >
                                <select
                                    id="status"
                                    value={form.data.status}
                                    onChange={(e) =>
                                        form.setData(
                                            'status',
                                            e.target.value as
                                                'draft' | 'published',
                                        )
                                    }
                                    className={inputClass}
                                >
                                    <option value="published">
                                        Tayang / Publikasi
                                    </option>
                                    <option value="draft">
                                        Draf (Belum Tayang)
                                    </option>
                                </select>
                            </Field>

                            <Field
                                label="Tanggal Pembaruan"
                                htmlFor="published_at"
                                error={form.errors.published_at}
                            >
                                <input
                                    id="published_at"
                                    type="date"
                                    value={form.data.published_at}
                                    onChange={(e) =>
                                        form.setData(
                                            'published_at',
                                            e.target.value,
                                        )
                                    }
                                    className={inputClass}
                                />
                            </Field>
                        </div>

                        {/* Ringkasan / Deskripsi Singkat */}
                        <Field
                            label="Deskripsi / Ringkasan Singkat"
                            htmlFor="deskripsi"
                            error={form.errors.deskripsi}
                        >
                            <textarea
                                id="deskripsi"
                                value={form.data.deskripsi}
                                onChange={(e) =>
                                    form.setData('deskripsi', e.target.value)
                                }
                                rows={2}
                                placeholder="Ringkasan singkat topik panduan ini…"
                                className={inputClass}
                            />
                        </Field>

                        {/* Isi Artikel (RichTextEditor) */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-ink">
                                Isi Artikel Panduan Lengkap
                            </label>
                            <RichTextEditor
                                value={form.data.konten}
                                onChange={(html) =>
                                    form.setData('konten', html)
                                }
                            />
                            {form.errors.konten && (
                                <p className="text-xs font-medium text-red-500">
                                    {form.errors.konten}
                                </p>
                            )}
                        </div>

                        {/* Gambar / Tangkapan Layar */}
                        <Field
                            label="Gambar / Screenshot Pendukung (opsional)"
                            htmlFor="gambar"
                            error={form.errors.gambar}
                        >
                            {editing?.gambar && !form.data.hapus_gambar && (
                                <div className="mb-2 flex items-center justify-between rounded-xl border border-line bg-canvas/40 p-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="size-4 text-primary" />
                                        <span>Gambar tersimpan</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            form.setData('hapus_gambar', true)
                                        }
                                        className="font-semibold text-red-500 hover:underline"
                                    >
                                        Hapus gambar
                                    </button>
                                </div>
                            )}
                            <input
                                id="gambar"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/jpg"
                                onChange={(e) => {
                                    form.setData(
                                        'gambar',
                                        e.target.files?.[0] ?? null,
                                    );

                                    if (e.target.files?.[0]) {
                                        form.setData('hapus_gambar', false);
                                    }
                                }}
                                className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                            />
                            <p className="text-xs text-muted">
                                Format JPG, PNG, atau WEBP · maks 5 MB
                            </p>
                        </Field>

                        {/* Dokumen PDF Pendukung */}
                        <Field
                            label="Dokumen Pendukung PDF / Berkas (opsional)"
                            htmlFor="dokumen"
                            error={form.errors.dokumen}
                        >
                            {editing?.dokumen && !form.data.hapus_dokumen && (
                                <div className="mb-2 flex items-center justify-between rounded-xl border border-line bg-canvas/40 p-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <FileText className="size-4 text-primary" />
                                        <span>
                                            Berkas tersimpan (
                                            {editing.type ?? 'PDF'})
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            form.setData('hapus_dokumen', true)
                                        }
                                        className="font-semibold text-red-500 hover:underline"
                                    >
                                        Hapus berkas
                                    </button>
                                </div>
                            )}
                            <input
                                id="dokumen"
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                onChange={(e) => {
                                    form.setData(
                                        'dokumen',
                                        e.target.files?.[0] ?? null,
                                    );

                                    if (e.target.files?.[0]) {
                                        form.setData('hapus_dokumen', false);
                                    }
                                }}
                                className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
                            />
                            <p className="text-xs text-muted">
                                PDF, Word, Excel, atau PowerPoint · maks 10 MB
                            </p>
                        </Field>

                        {/* Submit Buttons */}
                        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
                            <button
                                type="button"
                                onClick={closeForm}
                                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-canvas"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-hover disabled:opacity-60"
                            >
                                {form.processing && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}
                                Simpan Panduan
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </AppLayout>
    );
}

function Field({
    label,
    htmlFor,
    error,
    children,
}: {
    label: string;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
                {label}
            </label>
            {children}
            {error && (
                <p className="text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    );
}
