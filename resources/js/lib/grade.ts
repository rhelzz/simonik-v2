/**
 * Konversi nilai PKL (0-100) ke grade & kualifikasi. Harus selaras dengan
 * App\Models\Evaluation::gradeFor() / qualificationFor() di backend.
 */
export type Grade = 'A' | 'B' | 'C' | 'D';

export function gradeFor(score: number | null | undefined): Grade | null {
    if (score === null || score === undefined || Number.isNaN(score)) {
        return null;
    }

    if (score >= 80) {
        return 'A';
    }

    if (score >= 70) {
        return 'B';
    }

    if (score >= 60) {
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
