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
 * @property int $user_id
 * @property string $name
 * @property string $bidang
 * @property string $alamat
 * @property string $longitude
 * @property string $latitude
 * @property string|null $duration
 * @property int|null $pembimbing_id
 * @property int|null $teacher_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'name',
    'bidang',
    'alamat',
    'longitude',
    'latitude',
    'duration',
    'pembimbing_id',
    'teacher_id',
])]
class Industry extends Model
{
    /** @use HasFactory<IndustryFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
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

    /** @return HasMany<Evaluation, $this> */
    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class, 'industri_id');
    }

    /** @return HasMany<AspekProduktif, $this> */
    public function produktif(): HasMany
    {
        return $this->hasMany(AspekProduktif::class, 'industri_id');
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
