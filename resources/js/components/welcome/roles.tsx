import { Building2, GraduationCap, UserCheck, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { SectionHeading } from './section-heading';

const roles: {
    icon: ComponentType<{ className?: string }>;
    title: string;
    desc: string;
}[] = [
    {
        icon: Users,
        title: 'Sekolah & Wakasek',
        desc: 'Pantau seluruh siswa PKL, kelola data master, dan pegang rekap keseluruhan.',
    },
    {
        icon: UserCheck,
        title: 'Guru & Pembimbing',
        desc: 'Verifikasi kehadiran, baca jurnal, dan beri penilaian siswa bimbingan.',
    },
    {
        icon: GraduationCap,
        title: 'Siswa',
        desc: 'Absen di lokasi, isi jurnal harian, dan lihat progres PKL sendiri.',
    },
    {
        icon: Building2,
        title: 'Industri / DUDI',
        desc: 'Konfirmasi kehadiran dan aktivitas siswa yang ditempatkan di perusahaan.',
    },
];

export function Roles() {
    return (
        <section id="peran" className="scroll-mt-20 py-10 lg:py-14">
            <SectionHeading
                title="Satu sistem, empat peran"
                desc="Setiap orang di proses PKL punya tampilan dan akses yang sesuai perannya."
                align="left"
            />
            <div className="reveal mt-10 divide-y divide-line overflow-hidden rounded-3xl bg-surface">
                {roles.map((role) => {
                    const Icon = role.icon;

                    return (
                        <div
                            key={role.title}
                            className="group flex items-start gap-5 p-6 transition-colors hover:bg-primary-soft/50 sm:items-center sm:gap-6 sm:p-7"
                        >
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent transition-transform duration-300 group-hover:scale-110 group-hover:bg-accent group-hover:text-white">
                                <Icon className="size-5" />
                            </span>
                            <div className="sm:flex sm:flex-1 sm:items-center sm:gap-8">
                                <h3 className="text-base font-bold text-ink sm:w-56 sm:shrink-0">
                                    {role.title}
                                </h3>
                                <p className="mt-1 text-sm leading-relaxed text-muted sm:mt-0">
                                    {role.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
