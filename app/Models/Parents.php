<?php

namespace App\Models;

use Database\Factories\ParentsFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $nama
 * @property string $gender
 * @property string $alamat
 * @property string $occupation
 * @property string $phoneNumber
 * @property int $user_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['nama', 'gender', 'alamat', 'occupation', 'phoneNumber', 'user_id'])]
class Parents extends Model
{
    /** @use HasFactory<ParentsFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Student, $this> */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'parent_id');
    }

    /**
     * Kehadiran seluruh anak (siswa) dari orang tua ini, lewat user_id siswa.
     *
     * @return HasManyThrough<Attendance, Student, $this>
     */
    public function attendances(): HasManyThrough
    {
        return $this->hasManyThrough(
            Attendance::class,
            Student::class,
            'parent_id', // FK pada students -> parents.id
            'user_id',   // FK pada attendances -> students.user_id
            'id',        // local key pada parents
            'user_id',   // local key pada students
        );
    }
}
