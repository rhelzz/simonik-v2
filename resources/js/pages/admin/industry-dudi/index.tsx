import { Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Download,
    Eye,
    Filter,
    Globe,
    Mail,
    MapPin,
    Phone,
    Search,
    User,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AppLayout } from '@/layouts/app-layout';

type IndustryRow = {
    id: number;
    nib: string | null;
    name: string;
    bidang: string;
    alamat: string;
    rt: string | null;
    rw: string | null;
    dusun: string | null;
    kelurahan: string | null;
    kecamatan: string | null;
    kode_pos: string | null;
    latitude: string | null;
    longitude: string | null;
    email: string | null;
    website: string | null;
    npwp: string | null;
    pembimbing: string | null;
    complete: boolean;
};

type Props = {
    industries: {
        data: IndustryRow[];
        current_page: number;
        per_page: number;
        total: number;
        last_page: number;
    };
    stats: {
        total: number;
        complete: number;
        incomplete: number;
    };
    filters: {
        search: string;
        status: string;
    };
};

export default function IndustryDudiIndex({
    industries,
    stats,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedIndustry, setSelectedIndustry] = useState<IndustryRow | null>(
        null,
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/profil-industri',
            { search, status: filters.status },
            { preserveState: true, replace: true },
        );
    };

    const handleStatusFilter = (status: string) => {
        router.get(
            '/admin/profil-industri',
            { search: filters.search, status },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AppLayout title="Rekapan Profil Industri (e-Rapor)">
            <div className="space-y-6">
                {/* Header & Export Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link
                                href="/profile"
                                className="text-xs font-semibold text-muted hover:text-ink"
                            >
                                Profil
                            </Link>
                            <span className="text-xs text-muted">/</span>
                            <span className="text-xs font-bold text-primary">
                                Profil Industri
                            </span>
                        </div>
                        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
                            Rekapan Profil Industri (DUDI)
                        </h1>
                        <p className="text-sm text-muted">
                            Data kelengkapan profil industri untuk kebutuhan sinkronisasi e-Rapor Kemendikdasmen.
                        </p>
                    </div>

                    <a
                        href="/admin/profil-industri/export"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700"
                    >
                        <Download className="size-4" />
                        Export XLSX
                    </a>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <button
                        type="button"
                        onClick={() => handleStatusFilter('all')}
                        className={`flex items-center gap-4 rounded-3xl border p-5 text-left transition-all ${
                            filters.status === 'all'
                                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                : 'border-line bg-surface hover:border-primary/40'
                        }`}
                    >
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                            <Building2 className="size-6" />
                        </span>
                        <div>
                            <p className="text-xs font-medium text-muted">
                                Total Industri
                            </p>
                            <h3 className="text-2xl font-extrabold text-ink">
                                {stats.total}
                            </h3>
                            <p className="text-[11px] text-muted">
                                Seluruh mitra DUDI terdaftar
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleStatusFilter('complete')}
                        className={`flex items-center gap-4 rounded-3xl border p-5 text-left transition-all ${
                            filters.status === 'complete'
                                ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                                : 'border-line bg-surface hover:border-emerald-500/40'
                        }`}
                    >
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="size-6" />
                        </span>
                        <div>
                            <p className="text-xs font-medium text-muted">
                                Profil Lengkap (100%)
                            </p>
                            <h3 className="text-2xl font-extrabold text-emerald-700">
                                {stats.complete}
                            </h3>
                            <p className="text-[11px] text-emerald-600">
                                Siap sinkron e-Rapor
                            </p>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => handleStatusFilter('incomplete')}
                        className={`flex items-center gap-4 rounded-3xl border p-5 text-left transition-all ${
                            filters.status === 'incomplete'
                                ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
                                : 'border-line bg-surface hover:border-amber-500/40'
                        }`}
                    >
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                            <AlertCircle className="size-6" />
                        </span>
                        <div>
                            <p className="text-xs font-medium text-muted">
                                Belum Lengkap
                            </p>
                            <h3 className="text-2xl font-extrabold text-amber-700">
                                {stats.incomplete}
                            </h3>
                            <p className="text-[11px] text-amber-600">
                                Masih butuh pengisian
                            </p>
                        </div>
                    </button>
                </div>

                {/* Search & Table Area */}
                <div className="overflow-hidden rounded-3xl border border-line bg-surface">
                    <div className="flex flex-col gap-3 border-b border-line p-5 sm:flex-row sm:items-center sm:justify-between">
                        <form
                            onSubmit={handleSearch}
                            className="relative flex-1 max-w-md"
                        >
                            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama PT, NIB, bidang usaha, alamat…"
                                className="w-full rounded-2xl border border-line bg-canvas/40 py-2 pr-4 pl-10 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-none"
                            />
                        </form>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted">
                                Status:
                            </span>
                            <div className="flex rounded-xl bg-canvas p-1 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilter('all')}
                                    className={`rounded-lg px-2.5 py-1 transition-colors ${
                                        filters.status === 'all'
                                            ? 'bg-surface text-ink shadow-xs'
                                            : 'text-muted hover:text-ink'
                                    }`}
                                >
                                    Semua ({stats.total})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilter('complete')}
                                    className={`rounded-lg px-2.5 py-1 transition-colors ${
                                        filters.status === 'complete'
                                            ? 'bg-surface text-emerald-700 shadow-xs'
                                            : 'text-muted hover:text-ink'
                                    }`}
                                >
                                    Lengkap ({stats.complete})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusFilter('incomplete')}
                                    className={`rounded-lg px-2.5 py-1 transition-colors ${
                                        filters.status === 'incomplete'
                                            ? 'bg-surface text-amber-700 shadow-xs'
                                            : 'text-muted hover:text-ink'
                                    }`}
                                >
                                    Belum ({stats.incomplete})
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-ink">
                            <thead className="border-b border-line bg-canvas/40 text-[11px] font-bold tracking-wider text-muted uppercase">
                                <tr>
                                    <th className="px-5 py-3.5">Industri / DUDI</th>
                                    <th className="px-4 py-3.5">NIB & NPWP</th>
                                    <th className="px-4 py-3.5">Lokasi / Alamat</th>
                                    <th className="px-4 py-3.5">Pembimbing</th>
                                    <th className="px-4 py-3.5 text-center">Status e-Rapor</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {industries.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-5 py-12 text-center text-sm text-muted"
                                        >
                                            Tidak ada data industri yang cocok.
                                        </td>
                                    </tr>
                                ) : (
                                    industries.data.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="transition-colors hover:bg-canvas/30"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-ink">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-muted">
                                                    {item.bidang}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-xs">
                                                <div>
                                                    <span className="text-muted">NIB:</span>{' '}
                                                    <span className="font-semibold">
                                                        {item.nib || '—'}
                                                    </span>
                                                </div>
                                                <div className="mt-0.5">
                                                    <span className="text-muted">NPWP:</span>{' '}
                                                    <span>{item.npwp || '—'}</span>
                                                </div>
                                            </td>
                                            <td className="max-w-xs px-4 py-4 text-xs text-muted">
                                                <p className="truncate font-medium text-ink">
                                                    {item.alamat}
                                                </p>
                                                <p className="truncate text-[11px]">
                                                    {[item.kecamatan, item.kelurahan, item.kode_pos]
                                                        .filter(Boolean)
                                                        .join(', ') || 'Wilayah belum lengkap'}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4 text-xs">
                                                <div className="flex items-center gap-1.5 font-medium text-ink">
                                                    <User className="size-3.5 text-muted" />
                                                    {item.pembimbing || 'Belum ditugaskan'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                                                        item.complete
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {item.complete ? (
                                                        <>
                                                            <CheckCircle2 className="size-3.5" />
                                                            Lengkap
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertCircle className="size-3.5" />
                                                            Belum Lengkap
                                                        </>
                                                    )}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedIndustry(item)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas/60 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                                                >
                                                    <Eye className="size-3.5" />
                                                    Detail 15 Field
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {industries.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-line px-5 py-4 text-xs text-muted">
                            <span>
                                Menampilkan {industries.data.length} dari {industries.total} industri
                            </span>
                            <div className="flex gap-1.5">
                                {Array.from({ length: industries.last_page }).map((_, i) => {
                                    const p = i + 1;
                                    return (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() =>
                                                router.get(
                                                    '/admin/profil-industri',
                                                    {
                                                        search: filters.search,
                                                        status: filters.status,
                                                        page: p,
                                                    },
                                                    { preserveState: true },
                                                )
                                            }
                                            className={`grid size-8 place-items-center rounded-xl text-xs font-bold transition-colors ${
                                                p === industries.current_page
                                                    ? 'bg-primary text-white'
                                                    : 'border border-line bg-surface text-ink hover:bg-canvas'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Detail 15 Field DUDI */}
            {selectedIndustry && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-2xl">
                        <div className="flex items-start justify-between border-b border-line pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-ink">
                                    {selectedIndustry.name}
                                </h3>
                                <p className="text-xs text-muted">
                                    Rincian 15 field DUDI untuk sinkronisasi e-Rapor
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedIndustry(null)}
                                className="rounded-xl p-1 text-muted hover:bg-canvas hover:text-ink"
                            >
                                <XCircle className="size-5" />
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">NIB:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.nib || '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">NPWP:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.npwp || '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3 sm:col-span-2">
                                <span className="font-semibold text-muted">Bidang Usaha:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.bidang || '—'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3 sm:col-span-2">
                                <span className="font-semibold text-muted">Alamat Lengkap:</span>
                                <p className="mt-0.5 text-sm font-medium text-ink">
                                    {selectedIndustry.alamat || '—'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">RT / RW:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    RT {selectedIndustry.rt || '-'} / RW {selectedIndustry.rw || '-'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">Dusun:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.dusun || '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">Desa / Kelurahan:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.kelurahan || '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">Kecamatan:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.kecamatan || '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">Kode Pos:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.kode_pos || '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">Koordinat (Lintang, Bujur):</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.latitude && selectedIndustry.longitude
                                        ? `${selectedIndustry.latitude}, ${selectedIndustry.longitude}`
                                        : '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">Email Perusahaan:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink">
                                    {selectedIndustry.email || '— (Kosong)'}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-line p-3">
                                <span className="font-semibold text-muted">Website Perusahaan:</span>
                                <p className="mt-0.5 text-sm font-bold text-ink truncate">
                                    {selectedIndustry.website || '— (Kosong)'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedIndustry(null)}
                                className="rounded-xl bg-primary px-5 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
