<?php

namespace App\Models;

use Database\Factories\TeacherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $no_hp
 * @property int $departemen_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'name', 'no_hp', 'departemen_id'])]
class Teacher extends Model
{
    /** @use HasFactory<TeacherFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<Departemen, $this> */
    public function departements(): BelongsTo
    {
        return $this->belongsTo(Departemen::class, 'departemen_id');
    }

    /**
     * Industri/PT yang diampu guru ini (1 guru → banyak PT).
     *
     * @return HasMany<Industry, $this>
     */
    public function industries(): HasMany
    {
        return $this->hasMany(Industry::class, 'teacher_id');
    }

    /**
     * Siswa yang dibimbing guru ini, diturunkan lewat industri yang diampu.
     *
     * @return HasManyThrough<Student, Industry, $this>
     */
    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class,
            Industry::class,
            'teacher_id',  // FK pada industries → teachers.id
            'industri_id', // FK pada students → industries.id
            'id',          // local key pada teachers
            'id',          // local key pada industries
        );
    }
}
