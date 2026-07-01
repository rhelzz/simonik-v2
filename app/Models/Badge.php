<?php

namespace App\Models;

use Database\Factories\BadgeFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $key
 * @property string $name
 * @property string|null $description
 * @property string $icon
 * @property string $color
 * @property string $rule_type
 * @property int $rule_value
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'key',
    'name',
    'description',
    'icon',
    'color',
    'rule_type',
    'rule_value',
])]
class Badge extends Model
{
    /** @use HasFactory<BadgeFactory> */
    use HasFactory;

    public const RULE_STREAK_JOURNAL = 'streak_journal';

    public const RULE_TOTAL_JOURNAL = 'total_journal';

    public const RULE_TOTAL_ATTENDANCE = 'total_attendance';

    /** @var array<int, string> */
    public const RULE_TYPES = [
        self::RULE_STREAK_JOURNAL,
        self::RULE_TOTAL_JOURNAL,
        self::RULE_TOTAL_ATTENDANCE,
    ];

    /** @return BelongsToMany<Student, $this> */
    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_badge')
            ->withPivot('awarded_at')
            ->withTimestamps();
    }
}
