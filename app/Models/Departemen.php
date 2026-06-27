<?php

namespace App\Models;

use Database\Factories\DepartemenFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property int|null $user_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'user_id'])]
class Departemen extends Model
{
    /** @use HasFactory<DepartemenFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return HasMany<Classes, $this> */
    public function classes(): HasMany
    {
        return $this->hasMany(Classes::class);
    }

    /** @return HasOne<Student, $this> */
    public function students(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    /** @return HasMany<SignatureSetting, $this> */
    public function signatureSetting(): HasMany
    {
        return $this->hasMany(SignatureSetting::class, 'department_id');
    }
}
