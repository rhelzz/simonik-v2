<?php

namespace App\Models;

use Database\Factories\CertificateTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Template sertifikat: gambar latar + daftar anchor teks (posisi x/y persen).
 *
 * @property int $id
 * @property string $name
 * @property string $background_path
 * @property array<int, array<string, mixed>> $anchors
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'background_path', 'anchors', 'is_active'])]
class CertificateTemplate extends Model
{
    /** @use HasFactory<CertificateTemplateFactory> */
    use HasFactory;

    /** Field yang dapat ditaruh di template; nilainya diisi dari data siswa. */
    public const FIELDS = ['nama', 'nis', 'nomor', 'industri', 'tanggal'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'anchors' => 'array',
            'is_active' => 'boolean',
        ];
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
     * Hanya template yang aktif (dipakai untuk mencetak).
     *
     * @param  Builder<CertificateTemplate>  $query
     * @return Builder<CertificateTemplate>
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}
