import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, LoaderCircle, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import {
    index as assessmentsIndex,
    update,
} from '@/actions/App/Http/Controllers/AssessmentController';
import { AppLayout } from '@/layouts/app-layout';
import { gradeFor, gradeStyles, qualificationFor } from '@/lib/grade';
import type { Grade } from '@/lib/grade';
import { cn } from '@/lib/utils';

type AspectScoreRow = {
    id: number;
    no: number;
    kemampuan: string;
    score: number | null;
    grade: Grade | null;
    qualification: string | null;
};

type AssessmentShowProps = {
    student: {
        id: number;
        name: string;
        nis: string;
        class: string | null;
        industry: string | null;
    };
    teknis: AspectScoreRow[];
    nonTeknis: AspectScoreRow[];
    can: { teknis: boolean; nonTeknis: boolean };
};

type ScoresForm = { scores: Record<string, string> };

export default function AssessmentShow({
    student,
    teknis,
    nonTeknis,
    can,
}: AssessmentShowProps) {
    const form = useForm<ScoresForm>({
        scores: Object.fromEntries(
            [...teknis, ...nonTeknis].map((row) => [
                row.id,
                row.score === null ? '' : String(row.score),
            ]),
        ),
    });

    const editable = can.teknis || can.nonTeknis;

    function setScore(id: number, value: string) {
        form.setData('scores', { ...form.data.scores, [id]: value });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.put(update.url(student.id), { preserveScroll: true });
    }

    return (
        <AppLayout title="Rekap Penilaian">
            <form onSubmit={submit} className="space-y-5">
                <section className="rounded-3xl bg-surface p-5 sm:p-6">
                    <Link
                        href={assessmentsIndex.url()}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke daftar
                    </Link>
                    <div className="mt-4 flex flex-col gap-1">
                        <h2 className="text-lg font-bold text-ink">
                            {student.name}
                        </h2>
                        <p className="text-sm text-muted">
                            NIS {student.nis}
                            {student.class ? ` · ${student.class}` : ''}
                            {student.industry ? ` · ${student.industry}` : ''}
                        </p>
                    </div>
                </section>

                <ScoreTable
                    title="Aspek Non-Teknis"
                    subtitle="Dinilai guru pembimbing"
                    rows={nonTeknis}
                    editable={can.nonTeknis}
                    scores={form.data.scores}
                    errors={form.errors}
                    onChange={setScore}
                />

                <ScoreTable
                    title="Aspek Teknis"
                    subtitle="Dinilai pembimbing industri"
                    rows={teknis}
                    editable={can.teknis}
                    scores={form.data.scores}
                    errors={form.errors}
                    onChange={setScore}
                />

                {editable && (
                    <div className="flex items-center justify-end gap-3">
                        {form.recentlySuccessful && (
                            <span className="text-sm font-medium text-positive">
                                Tersimpan
                            </span>
                        )}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                        >
                            {form.processing ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <Save className="size-4" />
                            )}
                            Simpan nilai
                        </button>
                    </div>
                )}
            </form>
        </AppLayout>
    );
}

function ScoreTable({
    title,
    subtitle,
    rows,
    editable,
    scores,
    errors,
    onChange,
}: {
    title: string;
    subtitle: string;
    rows: AspectScoreRow[];
    editable: boolean;
    scores: Record<string, string>;
    errors: Partial<Record<string, string>>;
    onChange: (id: number, value: string) => void;
}) {
    return (
        <section className="rounded-3xl bg-surface p-5 sm:p-6">
            <div className="flex flex-col gap-0.5">
                <h3 className="text-base font-bold text-ink">{title}</h3>
                <p className="text-sm text-muted">{subtitle}</p>
            </div>

            {rows.length === 0 ? (
                <p className="mt-5 rounded-2xl border border-dashed border-line py-8 text-center text-sm text-muted">
                    Belum ada aspek pada kategori ini.
                </p>
            ) : (
                <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-160 border-collapse text-left text-sm">
                        <thead>
                            <tr className="text-xs font-semibold tracking-wide text-muted uppercase">
                                <th className="pb-3 font-semibold">No</th>
                                <th className="pb-3 font-semibold">
                                    Kemampuan
                                </th>
                                <th className="w-28 pb-3 font-semibold">
                                    Nilai
                                </th>
                                <th className="w-20 pb-3 font-semibold">
                                    Grade
                                </th>
                                <th className="pb-3 font-semibold">
                                    Keterangan
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-line">
                            {rows.map((row) => {
                                const raw = scores[row.id] ?? '';
                                const liveScore =
                                    editable && raw !== ''
                                        ? Number(raw)
                                        : row.score;
                                const grade = editable
                                    ? gradeFor(liveScore)
                                    : row.grade;
                                const qualification = editable
                                    ? qualificationFor(liveScore)
                                    : row.qualification;
                                const error = errors[`scores.${row.id}`];

                                return (
                                    <tr key={row.id}>
                                        <td className="py-3 align-top text-ink/80">
                                            {row.no}
                                        </td>
                                        <td className="py-3 align-top font-medium text-ink">
                                            {row.kemampuan}
                                        </td>
                                        <td className="py-3 align-top">
                                            {editable ? (
                                                <>
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        value={raw}
                                                        onChange={(event) =>
                                                            onChange(
                                                                row.id,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="0-100"
                                                        className="w-24 rounded-lg border border-line bg-canvas/40 px-3 py-1.5 text-sm text-ink focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                                                    />
                                                    {error && (
                                                        <p className="mt-1 text-xs font-medium text-red-500">
                                                            {error}
                                                        </p>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-ink/80">
                                                    {row.score ?? '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 align-top">
                                            {grade ? (
                                                <span
                                                    className={cn(
                                                        'inline-flex rounded-full px-2 py-0.5 text-xs font-bold',
                                                        gradeStyles[grade],
                                                    )}
                                                >
                                                    {grade}
                                                </span>
                                            ) : (
                                                <span className="text-muted">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 align-top text-ink/80">
                                            {qualification ?? '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
