import { BadgeCheck, CalendarCheck, MapPin, NotebookPen } from 'lucide-react';
import type { ComponentType } from 'react';
import { SectionHeading } from './section-heading';

const steps: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    desc: string;
}[] = [
    {
        icon: MapPin,
        title: 'Absen di lokasi',
        desc: 'Siswa absen masuk/pulang, terekam otomatis dengan foto dan koordinat GPS.',
    },
    {
        icon: NotebookPen,
        title: 'Isi jurnal harian',
        desc: 'Kegiatan hari itu ditulis di jurnal dan dikirim ke pembimbing.',
    },
    {
        icon: BadgeCheck,
        title: 'Diverifikasi pembimbing',
        desc: 'Pembimbing memeriksa dan menyetujui kehadiran serta jurnal siswa.',
    },
    {
        icon: CalendarCheck,
        title: 'Nilai & rapor keluar',
        desc: 'Penilaian terkumpul menjadi rapor dan sertifikat PKL yang siap dicetak.',
    },
];

export function HowItWorks() {
    return (
        <section id="alur" className="scroll-mt-20 py-10 lg:py-14">
            <SectionHeading
                eyebrow="Cara kerja"
                title="Dari absen sampai sertifikat"
                desc="Empat langkah sederhana yang berjalan otomatis setiap hari PKL."
            />
            <div className="reveal relative mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div
                    aria-hidden
                    className="absolute top-[2.85rem] right-[12.5%] left-[12.5%] hidden border-t-2 border-dashed border-line lg:block"
                />
                {steps.map((step, i) => {
                    const Icon = step.icon;

                    return (
                        <div
                            key={step.title}
                            className="group relative rounded-3xl bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                        >
                            <div className="flex items-center gap-3">
                                <span className="grid size-11 place-items-center rounded-2xl bg-primary text-white ring-4 ring-canvas transition-transform duration-300 group-hover:scale-110">
                                    <Icon className="size-5" />
                                </span>
                                <span className="text-3xl font-extrabold text-accent/30">
                                    0{i + 1}
                                </span>
                            </div>
                            <h3 className="mt-4 text-base font-bold text-ink">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted">
                                {step.desc}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
