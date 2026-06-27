<?php

namespace App\Models;

use Database\Factories\AspekProduktifFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property int $industri_id
 * @property string $name
 * @property string $score
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['student_id', 'industri_id', 'name', 'score'])]
class AspekProduktif extends Model
{
    /** @use HasFactory<AspekProduktifFactory> */
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
