import {
    BadgeCheck,
    Building2,
    ClipboardList,
    Fingerprint,
    NotebookPen,
    QrCode,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { SectionHeading } from './section-heading';
import { useSpotlight } from './use-spotlight';

const features: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    desc: string;
}[] = [
    {
        icon: Fingerprint,
        title: 'Absensi & geolokasi',
        desc: 'Kehadiran siswa terekam lengkap dengan foto, titik GPS, dan jam masuk/pulang.',
    },
    {
        icon: NotebookPen,
        title: 'Jurnal kegiatan',
        desc: 'Siswa menulis jurnal harian PKL dengan editor lengkap, kapan saja dari HP.',
    },
    {
        icon: BadgeCheck,
        title: 'Verifikasi pembimbing',
        desc: 'Pembimbing & industri memverifikasi kehadiran dan jurnal siswa bimbingannya.',
    },
    {
        icon: Building2,
        title: 'Data penempatan',
        desc: 'Kelola siswa, jurusan, kelas, industri, guru, dan pembimbing dalam satu tempat.',
    },
    {
        icon: ClipboardList,
        title: 'Penilaian & rapor',
        desc: 'Nilai PKL tersusun rapi, langsung menjadi rapor dan sertifikat siap cetak.',
    },
    {
        icon: QrCode,
        title: 'Sertifikat ber-QR',
        desc: 'Setiap dokumen punya QR bertanda tangan digital untuk verifikasi keasliannya.',
    },
];

export function Features() {
    const [lead, ...rest] = features;
    const LeadIcon = lead.icon;
    const spotlight = useSpotlight();

    return (
        <section id="fitur" className="scroll-mt-20 py-10 lg:py-14">
            <SectionHeading
                eyebrow="Fitur"
                title="Semua kebutuhan monitoring PKL"
                desc="Dari pendataan siswa sampai verifikasi industri, dirancang untuk semua peran di ekosistem PKL."
                align="left"
            />
            <div className="reveal mt-14 grid gap-4 lg:grid-cols-3">
                <div className="relative flex flex-col justify-end overflow-hidden rounded-3xl bg-primary p-8 text-white lg:row-span-2">
                    {/* Contextual imagery — placeholder. Swap for a real photo of a
                        student filling attendance / journal on-site. */}
                    <img
                        src="/images/biometric.jpg"
                        alt="Siswa melakukan absensi PKL di lokasi industri"
                        loading="lazy"
                        className="absolute inset-0 size-full object-cover"
                    />
                    <div
                        aria-hidden
                        className="absolute inset-0 bg-linear-to-t from-primary via-primary/80 to-primary/20"
                    />
                    <div className="relative">
                        <span className="grid size-12 place-items-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                            <LeadIcon className="size-6" />
                        </span>
                        <h3 className="mt-8 text-xl font-bold">{lead.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-white/85">
                            {lead.desc}
                        </p>
                    </div>
                </div>
                {rest.map((feature, i) => {
                    const Icon = feature.icon;
                    const warm = i % 3 === 1;
                    const wide = i === rest.length - 1;

                    if (wide) {
                        return (
                            <div
                                key={feature.title}
                                {...spotlight}
                                className="spotlight group flex items-center gap-5 rounded-3xl border border-line bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 lg:col-span-3"
                            >
                                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110">
                                    <Icon className="size-5" />
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-ink">
                                        {feature.title}
                                    </h3>
                                    <p className="mt-1 text-sm leading-relaxed text-muted">
                                        {feature.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={feature.title}
                            {...spotlight}
                            className={`spotlight group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 ${warm ? 'bg-accent/10' : 'bg-surface'}`}
                        >
                            <span
                                className={`grid size-11 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${warm ? 'bg-accent/15 text-accent' : 'bg-primary-soft text-primary'}`}
                            >
                                <Icon className="size-5" />
                            </span>
                            <h3 className="mt-4 text-base font-bold text-ink">
                                {feature.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {feature.desc}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
