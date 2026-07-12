<?php

namespace App\Models;

use Database\Factories\CertificateTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Template sertifikat: gambar latar + daftar anchor teks (posisi x/y persen).
 *
 * @property int $id
 * @property string $name
 * @property string $background_path
 * @property string|null $signature_path
 * @property array<int, array<string, mixed>> $anchors
 * @property array<string, mixed>|null $signature
 * @property string $scope
 * @property int|null $industry_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'background_path', 'signature_path', 'anchors', 'signature', 'scope', 'industry_id'])]
class CertificateTemplate extends Model
{
    /** @use HasFactory<CertificateTemplateFactory> */
    use HasFactory;

    /** Field yang dapat ditaruh di template; nilainya diisi dari data siswa. */
    public const FIELDS = ['nama', 'nis', 'nomor', 'industri', 'tanggal'];

    /** Pilihan font yang cocok untuk sertifikat (dimuat di app.blade.php). */
    public const FONTS = [
        'Poppins',
        'Playfair Display',
        'Merriweather',
        'Cormorant Garamond',
        'Montserrat',
        'Great Vibes',
    ];

    /** Otomatis tertera ke semua siswa (admin/kaprog saja yang bisa mengatur). */
    public const SCOPE_GLOBAL = 'global';

    /** Sertifikat prestasi: ditugaskan manual per siswa oleh admin/kaprog. */
    public const SCOPE_INDIVIDUAL = 'individual';

    /** Milik satu industri (dibuat pembimbing), hanya untuk siswa magang di sana. */
    public const SCOPE_INDUSTRY = 'industry';

    /** @var array<int, string> */
    public const SCOPES = [self::SCOPE_GLOBAL, self::SCOPE_INDIVIDUAL, self::SCOPE_INDUSTRY];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'anchors' => 'array',
            'signature' => 'array',
        ];
    }

    /** @return HasMany<Certificate, $this> */
    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    /** @return BelongsTo<Industry, $this> */
    public function industry(): BelongsTo
    {
        return $this->belongsTo(Industry::class);
    }

    /**
     * URL publik gambar latar dari path tersimpan.
     *
     * @return Attribute<string|null, never>
     */
    protected function background(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->background_path
                ? asset("/storage/{$this->background_path}")
                : null,
        );
    }

    /**
     * URL publik gambar TTD digital dari path tersimpan.
     *
     * @return Attribute<string|null, never>
     */
    protected function signatureUrl(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->signature_path
                ? asset("/storage/{$this->signature_path}")
                : null,
        );
    }

    /**
     * Template global: otomatis tertera ke semua siswa (lihat
     * CertificateController@stampGlobalTemplates).
     *
     * @param  Builder<CertificateTemplate>  $query
     * @return Builder<CertificateTemplate>
     */
    public function scopeGlobal(Builder $query): Builder
    {
        return $query->where('scope', self::SCOPE_GLOBAL);
    }
}
