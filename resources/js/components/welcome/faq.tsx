import { ArrowRight } from 'lucide-react';
import { SectionHeading } from './section-heading';

const faqs = [
    {
        q: 'Bagaimana cara mendapatkan akun?',
        a: 'Akun dibuat dan dibagikan oleh admin sekolah. Hubungi Kaprog atau Wakasek Humas untuk mendapatkan akses.',
    },
    {
        q: 'Apakah bisa dipakai dari HP?',
        a: 'Ya. SIMONIK dirancang mobile-first sehingga siswa bisa absen dan mengisi jurnal langsung dari ponsel di lokasi industri.',
    },
    {
        q: 'Bagaimana keaslian sertifikat dijamin?',
        a: 'Setiap sertifikat dan rapor memuat QR bertanda tangan digital yang bisa dipindai untuk memverifikasi keasliannya kapan saja.',
    },
];

export function Faq() {
    return (
        <section id="faq" className="scroll-mt-20 py-10 lg:py-14">
            <SectionHeading title="Pertanyaan yang sering ditanya" />
            <div className="reveal mx-auto mt-10 max-w-3xl space-y-3">
                {faqs.map((faq) => (
                    <details
                        key={faq.q}
                        className="group rounded-2xl border border-line bg-surface p-5 transition-colors open:border-primary/20 open:bg-primary-soft/40 [&_summary::-webkit-details-marker]:hidden"
                    >
                        <summary className="flex cursor-pointer items-center justify-between gap-4 text-sm font-semibold text-ink">
                            {faq.q}
                            <ArrowRight className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90 group-open:text-primary" />
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-muted">
                            {faq.a}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
}
