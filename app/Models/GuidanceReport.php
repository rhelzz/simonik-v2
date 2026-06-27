<?php

namespace App\Models;

use Database\Factories\GuidanceReportFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $student_id
 * @property Carbon|null $date
 * @property string|null $catatan
 * @property string|null $verified
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['student_id', 'date', 'catatan', 'verified'])]
class GuidanceReport extends Model
{
    /** @use HasFactory<GuidanceReportFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }

    /** @return BelongsTo<Student, $this> */
    public function students(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}
