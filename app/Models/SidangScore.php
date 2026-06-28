<?php

namespace App\Models;

use Database\Factories\SidangScoreFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property int $sidang_aspect_id
 * @property int $nilai
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['student_id', 'sidang_aspect_id', 'nilai'])]
class SidangScore extends Model
{
    /** @use HasFactory<SidangScoreFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'nilai' => 'integer',
        ];
    }

    /** @return BelongsTo<SidangAspect, $this> */
    public function aspect(): BelongsTo
    {
        return $this->belongsTo(SidangAspect::class, 'sidang_aspect_id');
    }

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
