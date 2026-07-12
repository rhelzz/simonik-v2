import { Link } from '@inertiajs/react';
import {
    ArrowRight,
    Download,
    FileSpreadsheet,
    Info,
    Settings2,
} from 'lucide-react';
import ClassController from '@/actions/App/Http/Controllers/ClassController';
import DepartemenController from '@/actions/App/Http/Controllers/DepartemenController';
import IndustryController from '@/actions/App/Http/Controllers/IndustryController';
import KaprogController from '@/actions/App/Http/Controllers/KaprogController';
import ParentController from '@/actions/App/Http/Controllers/ParentController';
import PembimbingController from '@/actions/App/Http/Controllers/PembimbingController';
import StudentController from '@/actions/App/Http/Controllers/StudentController';
import TeacherController from '@/actions/App/Http/Controllers/TeacherController';
import WakasekController from '@/actions/App/Http/Controllers/WakasekController';
import { AppLayout } from '@/layouts/app-layout';

type Step = {
    title: string;
    desc: string;
    needs: string[];
    templateUrl: string;
    exportUrl: string;
    indexUrl: string;
};

const steps: Step[] = [
    {
        title: 'Jurusan',
        desc: 'Program keahlian. Menjadi dasar untuk kelas, guru, dan kaprog.',
        needs: [],
        templateUrl: DepartemenController.template.url(),
        exportUrl: DepartemenController.export.url(),
        indexUrl: DepartemenController.index.url(),
    },
    {
        title: 'Kelas',
        desc: 'Rombongan belajar di tiap jurusan.',
        needs: ['Jurusan'],
        templateUrl: ClassController.template.url(),
        exportUrl: ClassController.export.url(),
        indexUrl: ClassController.index.url(),
    },
    {
        title: 'Wakasek',
        desc: 'Akun wakil kepala sekolah (Humas/Hubin).',
        needs: [],
        templateUrl: WakasekController.template.url(),
        exportUrl: WakasekController.export.url(),
        indexUrl: WakasekController.index.url(),
    },
    {
        title: 'Kepala Program',
        desc: 'Akun kaprog, bisa langsung ditautkan ke jurusan yang dipimpin.',
        needs: ['Jurusan'],
        templateUrl: KaprogController.template.url(),
        exportUrl: KaprogController.export.url(),
        indexUrl: KaprogController.index.url(),
    },
    {
        title: 'Guru Pembimbing',
        desc: 'Akun guru beserta jurusan yang dibimbing.',
        needs: ['Jurusan'],
        templateUrl: TeacherController.template.url(),
        exportUrl: TeacherController.export.url(),
        indexUrl: TeacherController.index.url(),
    },
    {
        title: 'Pembimbing Industri',
        desc: 'Akun pembimbing dari pihak DUDI.',
        needs: [],
        templateUrl: PembimbingController.template.url(),
        exportUrl: PembimbingController.export.url(),
        indexUrl: PembimbingController.index.url(),
    },
    {
        title: 'Industri (DUDI)',
        desc: 'Tempat PKL, bisa langsung ditautkan ke guru & pembimbing.',
        needs: ['Guru Pembimbing', 'Pembimbing Industri'],
        templateUrl: IndustryController.template.url(),
        exportUrl: IndustryController.export.url(),
        indexUrl: IndustryController.index.url(),
    },
    {
        title: 'Orang Tua',
        desc: 'Akun orang tua/wali siswa.',
        needs: [],
        templateUrl: ParentController.template.url(),
        exportUrl: ParentController.export.url(),
        indexUrl: ParentController.index.url(),
    },
    {
        title: 'Siswa',
        desc: 'Diimpor paling akhir karena menautkan kelas, jurusan, industri, dan orang tua.',
        needs: ['Kelas', 'Industri', 'Orang Tua'],
        templateUrl: StudentController.template.url(),
        exportUrl: StudentController.export.url(),
        indexUrl: StudentController.index.url(),
    },
];

export default function DataPortGuide() {
    return (
        <AppLayout title="Panduan Import/Export">
            {/* Masthead */}
            <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-primary via-primary to-[#3a3f9e] p-6 text-white sm:p-8">
                <div className="absolute -top-20 -right-14 size-60 rounded-full bg-white/10 blur-3xl" />
                <div className="relative max-w-2xl">
                    <p className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
                        <FileSpreadsheet className="size-4" />
                        Import &amp; Export Massal
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Urutan impor data
                    </h1>
                    <p className="mt-2 text-sm text-white/80">
                        Impor mengikuti urutan di bawah agar setiap relasi bisa
                        ditemukan. Tiap data punya template contoh berisi
                        petunjuk pengisian. Akun yang dibuat memakai kata sandi
                        default{' '}
                        <span className="font-semibold text-white">
                            password
                        </span>
                        , dan data yang sudah ada otomatis dilewati.
                    </p>
                </div>
            </section>

            {/* Timeline langkah */}
            <section className="mt-6 space-y-3">
                {steps.map((step, index) => (
                    <div
                        key={step.title}
                        className="rounded-3xl bg-surface p-5 sm:p-6"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-4">
                                <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-sm font-extrabold text-primary tabular-nums">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="min-w-0">
                                    <h2 className="font-bold text-ink">
                                        {step.title}
                                    </h2>
                                    <p className="text-sm text-muted">
                                        {step.desc}
                                    </p>
                                    {step.needs.length > 0 && (
                                        <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                                            <Info className="size-3.5" />
                                            Butuh lebih dulu:
                                            {step.needs.map((need) => (
                                                <span
                                                    key={need}
                                                    className="rounded-full bg-canvas px-2 py-0.5 font-semibold text-ink/70"
                                                >
                                                    {need}
                                                </span>
                                            ))}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pl-4">
                                <a
                                    href={step.templateUrl}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary-soft px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                                >
                                    <Download className="size-4" />
                                    Template
                                </a>
                                <a
                                    href={step.exportUrl}
                                    className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                                >
                                    <FileSpreadsheet className="size-4" />
                                    Ekspor
                                </a>
                                <Link
                                    href={step.indexUrl}
                                    className="inline-flex items-center gap-2 rounded-xl border border-line px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-canvas"
                                >
                                    <Settings2 className="size-4" />
                                    Kelola
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </section>

            <p className="mt-5 flex items-center justify-center gap-2 text-xs text-muted">
                Tip: unduh template di tiap langkah, isi sesuai sheet
                &quot;Petunjuk&quot;, lalu impor melalui tombol
                <ArrowRight className="size-3.5" />
                <span className="font-semibold text-ink">Impor</span> di halaman
                masing-masing data.
            </p>
        </AppLayout>
    );
}
