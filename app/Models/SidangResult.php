<?php

namespace App\Models;

use Database\Factories\SidangResultFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $student_id
 * @property string|null $deskripsi
 * @property string|null $penguji_1
 * @property string|null $penguji_2
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['student_id', 'deskripsi', 'penguji_1', 'penguji_2', 'status'])]
class SidangResult extends Model
{
    /** @use HasFactory<SidangResultFactory> */
    use HasFactory;

    /** @return BelongsTo<Student, $this> */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /** @return HasMany<SidangScore, $this> */
    public function scores(): HasMany
    {
        return $this->hasMany(SidangScore::class, 'student_id', 'student_id');
    }
}
