<?php

namespace App\Models;

use Database\Factories\VisitsFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int $industri_id
 * @property Carbon $visitDate
 * @property string $visitReport
 * @property string|null $image
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'industri_id', 'visitDate', 'visitReport', 'image'])]
class Visits extends Model
{
    /** @use HasFactory<VisitsFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'visitDate' => 'date',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Industry, $this> */
    public function industri(): BelongsTo
    {
        return $this->belongsTo(Industry::class, 'industri_id');
    }

    /**
     * Akses URL publik gambar kunjungan dari path yang tersimpan.
     *
     * @return Attribute<string|null, never>
     */
    protected function image(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): ?string => $value ? asset("/storage/{$value}") : null,
        );
    }
}
