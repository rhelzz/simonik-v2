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
 * @property string|null $kategori
 * @property string|null $deskripsi
 * @property string|null $konten
 * @property string|null $gambar
 * @property string|null $dokumen
 * @property string $status
 * @property int $urutan
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'judul',
    'kategori',
    'deskripsi',
    'konten',
    'gambar',
    'dokumen',
    'status',
    'urutan',
    'published_at',
])]
class Guide extends Model
{
    /** @use HasFactory<GuideFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'urutan' => 'integer',
        ];
    }

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
            get: function (?string $value, array $attributes): ?string {
                if (! $value) {
                    return null;
                }

                $id = $attributes['id'] ?? null;

                return $id ? route('guides.dokumen', $id) : asset("/storage/{$value}");
            },
        );
    }

    /**
     * Akses URL publik gambar panduan dari path yang tersimpan.
     *
     * @return Attribute<string|null, never>
     */
    protected function gambar(): Attribute
    {
        return Attribute::make(
            get: function (?string $value, array $attributes): ?string {
                if (! $value) {
                    return null;
                }

                $id = $attributes['id'] ?? null;

                return $id ? route('guides.gambar', $id) : asset("/storage/{$value}");
            },
        );
    }
}
