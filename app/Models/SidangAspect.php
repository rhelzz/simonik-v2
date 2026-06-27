<?php

namespace App\Models;

use Database\Factories\SidangAspectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $nama_aspek
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['nama_aspek'])]
class SidangAspect extends Model
{
    /** @use HasFactory<SidangAspectFactory> */
    use HasFactory;

    /** @return HasMany<SidangScore, $this> */
    public function scores(): HasMany
    {
        return $this->hasMany(SidangScore::class);
    }
}
