<?php

namespace App\Models;

use Database\Factories\IndustryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $bidang
 * @property string $alamat
 * @property string $longitude
 * @property string $latitude
 * @property int $radius
 * @property string|null $jam_masuk
 * @property string|null $jam_pulang
 * @property string|null $duration
 * @property int|null $pembimbing_id
 * @property int|null $teacher_id
 * @property int|null $kuota
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'bidang',
    'alamat',
    'longitude',
    'latitude',
    'radius',
    'jam_masuk',
    'jam_pulang',
    'duration',
    'pembimbing_id',
    'teacher_id',
    'kuota',
])]
class Industry extends Model
{
    /** @use HasFactory<IndustryFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'radius' => 'integer',
            'kuota' => 'integer',
        ];
    }

    /** @return HasMany<Student, $this> */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'industri_id');
    }

    /** @return BelongsTo<Teacher, $this> */
    public function teachers(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    /** @return HasMany<Visits, $this> */
    public function visits(): HasMany
    {
        return $this->hasMany(Visits::class, 'industri_id');
    }

    /** @return HasMany<Schedule, $this> */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'industri_id');
    }

    /** @return HasMany<SignatureSetting, $this> */
    public function signature(): HasMany
    {
        return $this->hasMany(SignatureSetting::class);
    }

    /** @return BelongsTo<Pembimbing, $this> */
    public function pembimbingNormatif(): BelongsTo
    {
        return $this->belongsTo(Pembimbing::class, 'pembimbing_id');
    }
}
