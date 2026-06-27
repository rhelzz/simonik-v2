<?php

namespace App\Models;

use Database\Factories\ClassesFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 * @property int $departemen_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'slug', 'departemen_id'])]
class Classes extends Model
{
    /** @use HasFactory<ClassesFactory> */
    use HasFactory;

    /** @return BelongsTo<Departemen, $this> */
    public function departemens(): BelongsTo
    {
        return $this->belongsTo(Departemen::class, 'departemen_id');
    }

    /** @return HasMany<Student, $this> */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'class_id');
    }
}
