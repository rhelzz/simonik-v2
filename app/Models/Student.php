<?php

namespace App\Models;

use Database\Factories\StudentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string $nis
 * @property string $placeOfBirth
 * @property Carbon $dateOfBirth
 * @property string $gender
 * @property string $bloodType
 * @property string $alamat
 * @property string $image
 * @property int $class_id
 * @property int $industri_id
 * @property int $departemen_id
 * @property int $parent_id
 * @property bool $archived
 * @property string $status_pkl
 * @property string|null $sertifikat_url
 * @property Carbon|null $pkl_start
 * @property Carbon|null $pkl_end
 * @property int|null $p_k_l_period_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'name',
    'nis',
    'placeOfBirth',
    'dateOfBirth',
    'gender',
    'bloodType',
    'alamat',
    'image',
    'class_id',
    'industri_id',
    'departemen_id',
    'parent_id',
    'archived',
    'status_pkl',
    'sertifikat_url',
    'pkl_start',
    'pkl_end',
    'p_k_l_period_id',
])]
class Student extends Model
{
    /** @use HasFactory<StudentFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dateOfBirth' => 'date',
            'pkl_start' => 'date',
            'pkl_end' => 'date',
            'archived' => 'boolean',
        ];
    }

    /** @return BelongsTo<Classes, $this> */
    public function classes(): BelongsTo
    {
        return $this->belongsTo(Classes::class, 'class_id');
    }

    /** @return BelongsTo<Parents, $this> */
    public function parents(): BelongsTo
    {
        return $this->belongsTo(Parents::class, 'parent_id');
    }

    /** @return BelongsTo<Departemen, $this> */
    public function departements(): BelongsTo
    {
        return $this->belongsTo(Departemen::class, 'departemen_id');
    }

    /** @return BelongsTo<Industry, $this> */
    public function industries(): BelongsTo
    {
        return $this->belongsTo(Industry::class, 'industri_id');
    }

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return BelongsTo<PKLPeriod, $this> */
    public function pkl_period(): BelongsTo
    {
        return $this->belongsTo(PKLPeriod::class, 'p_k_l_period_id');
    }

    /** @return HasMany<Evaluation, $this> */
    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class);
    }

    /**
     * Absensi siswa, ditautkan lewat `user_id` (akun siswa) karena tabel
     * `attendances` menyimpan `user_id`, bukan `student_id`.
     *
     * @return HasMany<Attendance, $this>
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'user_id', 'user_id');
    }

    /**
     * Jurnal kegiatan harian siswa, ditautkan lewat `user_id` (akun siswa)
     * karena tabel `activities` menyimpan `user_id`, bukan `student_id`.
     *
     * @return HasMany<Activity, $this>
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'user_id', 'user_id');
    }

    /** @return HasMany<GuidanceReport, $this> */
    public function guidance_report(): HasMany
    {
        return $this->hasMany(GuidanceReport::class);
    }

    /** @return BelongsToMany<Badge, $this> */
    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badge::class, 'student_badge')
            ->withPivot('awarded_at')
            ->withTimestamps();
    }

    /**
     * Akses URL publik gambar siswa dari path yang tersimpan.
     *
     * @return Attribute<string|null, never>
     */
    protected function image(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): ?string => $value ? asset("/storage/{$value}") : null,
        );
    }

    /**
     * Hanya siswa yang diarsipkan pada tahun tertentu.
     *
     * @param  Builder<Student>  $query
     * @return Builder<Student>
     */
    public function scopeArchived(Builder $query, int $year): Builder
    {
        return $query->where('archived', true)
            ->whereYear('created_at', $year);
    }
}
