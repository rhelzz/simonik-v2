<?php

namespace App\Models;

use Database\Factories\EvaluationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Skor penilaian seorang siswa untuk satu aspek master (0-100).
 * Grade A/B/C/D diturunkan dari skor (lihat {@see self::gradeFor()}).
 *
 * @property int $id
 * @property int $student_id
 * @property int $aspek_produktif_id
 * @property int $score
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['student_id', 'aspek_produktif_id', 'score'])]
class Evaluation extends Model
{
    /** @use HasFactory<EvaluationFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'score' => 'integer',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function students(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    /** @return BelongsTo<AspekProduktif, $this> */
    public function aspek(): BelongsTo
    {
        return $this->belongsTo(AspekProduktif::class, 'aspek_produktif_id');
    }

    /**
     * Konversi skor (0-100) ke grade A/B/C/D.
     */
    public static function gradeFor(?int $score): ?string
    {
        if ($score === null) {
            return null;
        }

        return match (true) {
            $score >= 80 => 'A',
            $score >= 70 => 'B',
            $score >= 60 => 'C',
            default => 'D',
        };
    }

    /**
     * Kualifikasi/keterangan teks untuk sebuah skor.
     */
    public static function qualificationFor(?int $score): ?string
    {
        return match (self::gradeFor($score)) {
            'A' => 'Sangat baik',
            'B' => 'Baik',
            'C' => 'Cukup',
            'D' => 'Kurang',
            default => null,
        };
    }
}
