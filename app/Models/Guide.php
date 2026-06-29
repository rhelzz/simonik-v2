<?php

namespace App\Models;

use Database\Factories\GuideFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $judul
 * @property string|null $deskripsi
 * @property string $dokumen
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'judul', 'deskripsi', 'dokumen'])]
class Guide extends Model
{
    /** @use HasFactory<GuideFactory> */
    use HasFactory;

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Akses URL publik dokumen panduan dari path yang tersimpan.
     *
     * @return Attribute<string|null, never>
     */
    protected function dokumen(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): ?string => $value ? asset("/storage/{$value}") : null,
        );
    }
}
