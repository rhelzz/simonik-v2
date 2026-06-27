<?php

namespace App\Models;

use Database\Factories\SignatureSettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $role
 * @property string $name
 * @property string $ttd_path
 * @property int|null $department_id
 * @property int|null $industry_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['role', 'name', 'ttd_path', 'industry_id', 'department_id'])]
class SignatureSetting extends Model
{
    /** @use HasFactory<SignatureSettingFactory> */
    use HasFactory;

    /** @return BelongsTo<Industry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    /** @return BelongsTo<Departemen, $this> */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Departemen::class, 'department_id');
    }
}
