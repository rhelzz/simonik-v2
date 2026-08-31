/**
 * Konversi nilai PKL (0-100) ke grade & kualifikasi. Harus selaras dengan
 * App\Models\Evaluation::gradeFor() / qualificationFor() di backend.
 */
export type Grade = 'A' | 'B' | 'C' | 'D';

export function gradeFor(score: number | null | undefined): Grade | null {
    if (score === null || score === undefined || Number.isNaN(score)) {
        return null;
    }

    if (score >= 90) {
        return 'A';
    }

    if (score >= 80) {
        return 'B';
    }

    if (score >= 71) {
        return 'C';
    }

    return 'D';
}

export const qualificationLabels: Record<Grade, string> = {
    A: 'Sangat baik',
    B: 'Baik',
    C: 'Cukup',
    D: 'Kurang',
};

export const gradeRanges: Array<{ grade: Grade; range: string }> = [
    { grade: 'A', range: '90–100' },
    { grade: 'B', range: '80–89' },
    { grade: 'C', range: '71–79' },
    { grade: 'D', range: '0–70' },
];

export function qualificationFor(
    score: number | null | undefined,
): string | null {
    const grade = gradeFor(score);

    return grade ? qualificationLabels[grade] : null;
}

export const gradeStyles: Record<Grade, string> = {
    A: 'bg-positive/15 text-positive',
    B: 'bg-primary/10 text-primary',
    C: 'bg-warning/15 text-warning',
    D: 'bg-red-50 text-red-600',
};
