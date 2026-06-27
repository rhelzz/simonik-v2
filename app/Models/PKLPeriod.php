<?php

namespace App\Models;

use Database\Factories\PKLPeriodFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name_period
 * @property Carbon|null $start_period
 * @property Carbon|null $end_period
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name_period', 'start_period', 'end_period'])]
class PKLPeriod extends Model
{
    /** @use HasFactory<PKLPeriodFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_period' => 'date',
            'end_period' => 'date',
        ];
    }

    /** @return HasMany<Student, $this> */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'p_k_l_period_id');
    }
}
