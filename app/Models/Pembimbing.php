<?php

namespace App\Models;

use Database\Factories\PembimbingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $no_hp
 * @property string|null $gender
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'name', 'no_hp', 'gender'])]
class Pembimbing extends Model
{
    /** @use HasFactory<PembimbingFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return HasOne<Industry, $this> */
    public function industry(): HasOne
    {
        return $this->hasOne(Industry::class, 'pembimbing_id');
    }

    /**
     * Siswa yang dibimbing, diturunkan lewat industri yang dipegang pembimbing.
     *
     * @return HasManyThrough<Student, Industry, $this>
     */
    public function students(): HasManyThrough
    {
        return $this->hasManyThrough(
            Student::class,
            Industry::class,
            'pembimbing_id', // FK pada industries → pembimbings.id
            'industri_id',   // FK pada students → industries.id
            'id',            // local key pada pembimbings
            'id',            // local key pada industries
        );
    }
}
