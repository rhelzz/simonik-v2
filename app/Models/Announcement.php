<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Database\Factories\AnnouncementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $title
 * @property string $body
 * @property array<int, string> $roles
 * @property Carbon $starts_at
 * @property Carbon $ends_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'title',
    'body',
    'roles',
    'starts_at',
    'ends_at',
])]
class Announcement extends Model
{
    /** @use HasFactory<AnnouncementFactory> */
    use HasFactory;

    /** Target "semua pengguna" — lihat catatan di migrasi. */
    public const ALL_ROLES = '*';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'roles' => 'array',
            'starts_at' => 'date',
            'ends_at' => 'date',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Pengumuman yang periodenya mencakup tanggal tertentu — INKLUSIF di kedua
     * ujung, supaya pengumuman ber-`ends_at` hari ini masih tampil hari ini
     * (itu yang diharapkan operator saat mengetik "sampai 30 Agustus").
     *
     * @param  Builder<Announcement>  $query
     * @return Builder<Announcement>
     */
    public function scopeActiveOn(Builder $query, CarbonInterface $date): Builder
    {
        return $query->whereDate('starts_at', '<=', $date)
            ->whereDate('ends_at', '>=', $date);
    }

    /**
     * Apakah pengumuman ini ditujukan untuk user tersebut?
     *
     * ponytail: dievaluasi di PHP, bukan lewat WHERE JSON_CONTAINS — fungsi itu
     * tidak ada di SQLite yang dipakai test suite, dan himpunan pengumuman
     * AKTIF per hari sangat kecil (realistis 0-5 baris). Pindahkan ke SQL kalau
     * suatu hari pengumuman aktif serentak menembus ratusan baris.
     */
    public function isFor(User $user): bool
    {
        return in_array(self::ALL_ROLES, $this->roles, true)
            || $user->hasAnyRole($this->roles);
    }
}
