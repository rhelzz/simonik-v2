import { router } from '@inertiajs/react';
import { Building2, Check, Handshake, Search, Users } from 'lucide-react';
import { useState } from 'react';
import {
    index,
    updateKuota,
} from '@/actions/App/Http/Controllers/PartnershipController';
import { Pagination } from '@/components/ui/pagination';
import { AppLayout } from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { Paginated } from '@/types';

type Partner = {
    id: number;
    name: string;
    bidang: string;
    kuota: number | null;
    placed: number;
    remaining: number | null;
    over: boolean;
    full: boolean;
};

type Props = {
    partners: Paginated<Partner>;
    filters: { search: string };
    summary: {
        partners: number;
        capacity: number;
        placed: number;
        overCapacity: number;
    };
};

export default function PartnershipsIndex({
    partners,
    filters,
    summary,
}: Props) {
    const [search, setSearch] = useState(filters.search);

    return (
        <AppLayout title="Kemitraan & Kuota">
            <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Stat
                    icon={Building2}
                    label="Total mitra"
                    value={summary.partners}
                    tint="bg-primary-soft text-primary"
                />
                <Stat
                    icon={Handshake}
                    label="Daya tampung"
                    value={summary.capacity}
                    tint="bg-accent/15 text-accent"
                />
                <Stat
                    icon={Users}
                    label="Siswa ditempatkan"
                    value={summary.placed}
                    tint="bg-positive/15 text-positive"
                />
                <Stat
                    icon={Building2}
                    label="Mitra kelebihan"
                    value={summary.overCapacity}
                    tint="bg-red-500/10 text-red-600"
                />
            </section>

            <section className="mt-5 rounded-3xl bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-base font-bold text-ink">
                        Kelola kuota mitra industri
                    </h2>
                    <p className="text-sm text-muted">
                        Tetapkan kuota penerimaan siswa PKL tiap industri.
                        Kosongkan untuk tanpa batas.
                    </p>
                </div>

                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(
                            index.url(),
                            { search },
                            {
                                preserveState: true,
                                replace: true,
                                preserveScroll: true,
                            },
                        );
                    }}
                    className="mt-5"
                >
                    <label className="flex items-center gap-2 rounded-xl border border-line bg-canvas/40 px-4 py-2.5 text-sm text-muted">
                        <Search className="size-4" />
                        <input
                            type="search"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama industri…"
                            className="w-full bg-transparent text-ink placeholder:text-muted focus:outline-none"
                        />
                    </label>
                </form>

                {partners.data.length === 0 ? (
                    <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line py-14 text-center">
                        <Handshake className="size-8 text-muted" />
                        <p className="text-sm font-medium text-ink">
                            Tidak ada industri
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 space-y-3">
                        {partners.data.map((partner) => (
                            <PartnerRow key={partner.id} partner={partner} />
                        ))}
                    </div>
                )}

                <Pagination meta={partners} />
            </section>
        </AppLayout>
    );
}

function PartnerRow({ partner }: { partner: Partner }) {
    const [value, setValue] = useState(
        partner.kuota === null ? '' : String(partner.kuota),
    );
    const [saving, setSaving] = useState(false);

    const dirty =
        value !== (partner.kuota === null ? '' : String(partner.kuota));

    const pct =
        partner.kuota && partner.kuota > 0
            ? Math.min(100, Math.round((partner.placed / partner.kuota) * 100))
            : 0;

    function save() {
        setSaving(true);
        router.patch(
            updateKuota.url(partner.id),
            { kuota: value === '' ? null : Number(value) },
            {
                preserveScroll: true,
                onFinish: () => setSaving(false),
            },
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-line bg-canvas/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{partner.name}</p>
                    {partner.kuota !== null &&
                        (partner.over ? (
                            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600">
                                Kelebihan
                            </span>
                        ) : partner.full ? (
                            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
                                Penuh
                            </span>
                        ) : (
                            <span className="rounded-full bg-positive/15 px-2 py-0.5 text-xs font-semibold text-positive">
                                Tersedia
                            </span>
                        ))}
                </div>
                <p className="text-xs text-muted">{partner.bidang}</p>
                <div className="mt-2 flex items-center gap-2">
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted/20">
                        <div
                            className={cn(
                                'h-full rounded-full',
                                partner.over
                                    ? 'bg-red-500'
                                    : partner.full
                                      ? 'bg-warning'
                                      : 'bg-primary',
                            )}
                            style={{ width: `${partner.kuota ? pct : 0}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted">
                        {partner.placed}
                        {partner.kuota !== null ? `/${partner.kuota}` : ''}{' '}
                        siswa
                        {partner.kuota === null ? ' · tanpa batas' : ''}
                    </span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="∞"
                    className="w-24 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
                <button
                    type="button"
                    onClick={save}
                    disabled={!dirty || saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover disabled:opacity-40"
                >
                    <Check className="size-4" />
                    Simpan
                </button>
            </div>
        </div>
    );
}

function Stat({
    icon: Icon,
    label,
    value,
    tint,
}: {
    icon: typeof Building2;
    label: string;
    value: number;
    tint: string;
}) {
    return (
        <div className="rounded-2xl bg-surface p-5">
            <span
                className={cn(
                    'grid size-11 place-items-center rounded-xl',
                    tint,
                )}
            >
                <Icon className="size-5" />
            </span>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
                {value}
            </p>
            <p className="text-sm font-medium text-muted">{label}</p>
        </div>
    );
}
