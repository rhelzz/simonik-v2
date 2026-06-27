<?php

namespace App\Models;

use Database\Factories\EvaluationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property int $industri_id
 * @property string|null $skills
 * @property string $score
 * @property string|null $disiplinWaktu
 * @property string|null $kemampuanKerja
 * @property string|null $kualitasKerja
 * @property string|null $inisiatif
 * @property string|null $perilaku
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'student_id',
    'industri_id',
    'skills',
    'score',
    'disiplinWaktu',
    'kemampuanKerja',
    'kualitasKerja',
    'inisiatif',
    'perilaku',
])]
class Evaluation extends Model
{
    /** @use HasFactory<EvaluationFactory> */
    use HasFactory;

    /** @return BelongsTo<Student, $this> */
    public function students(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    /** @return BelongsTo<Industry, $this> */
    public function industries(): BelongsTo
    {
        return $this->belongsTo(Industry::class, 'industri_id');
    }
}
