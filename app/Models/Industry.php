<?php

namespace App\Models;

use Database\Factories\IndustryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $nib
 * @property string $bidang
 * @property string $alamat
 * @property string|null $rt
 * @property string|null $rw
 * @property string|null $dusun
 * @property string|null $kelurahan
 * @property string|null $kecamatan
 * @property string|null $kode_pos
 * @property string|null $longitude
 * @property string|null $latitude
 * @property int $radius
 * @property string|null $jam_masuk
 * @property string|null $jam_pulang
 * @property string|null $duration
 * @property string|null $email
 * @property string|null $website
 * @property string|null $npwp
 * @property int|null $pembimbing_id
 * @property int|null $teacher_id
 * @property int|null $kuota
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'nib',
    'bidang',
    'alamat',
    'rt',
    'rw',
    'dusun',
    'kelurahan',
    'kecamatan',
    'kode_pos',
    'longitude',
    'latitude',
    'radius',
    'jam_masuk',
    'jam_pulang',
    'duration',
    'email',
    'website',
    'npwp',
    'pembimbing_id',
    'teacher_id',
    'kuota',
])]
class Industry extends Model
{
    /** @use HasFactory<IndustryFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'radius' => 'integer',
            'kuota' => 'integer',
        ];
    }

    /** @return HasMany<Student, $this> */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'industri_id');
    }

    /** @return BelongsTo<Teacher, $this> */
    public function teachers(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    /** @return HasMany<Visits, $this> */
    public function visits(): HasMany
    {
        return $this->hasMany(Visits::class, 'industri_id');
    }

    /** @return HasMany<Schedule, $this> */
    public function schedules(): HasMany
    {
        return $this->hasMany(Schedule::class, 'industri_id');
    }

    /** @return HasMany<SignatureSetting, $this> */
    public function signature(): HasMany
    {
        return $this->hasMany(SignatureSetting::class);
    }

    /** @return BelongsTo<Pembimbing, $this> */
    public function pembimbingNormatif(): BelongsTo
    {
        return $this->belongsTo(Pembimbing::class, 'pembimbing_id');
    }

    /**
     * Profil industri lengkap jika 15 field utama data DUDI e-Rapor terisi.
     */
    public function hasCompleteDudiProfile(): bool
    {
        return ! empty($this->nib)
            && ! empty($this->name)
            && ! empty($this->bidang)
            && ! empty($this->alamat)
            && ! empty($this->rt)
            && ! empty($this->rw)
            && ! empty($this->dusun)
            && ! empty($this->kelurahan)
            && ! empty($this->kecamatan)
            && ! empty($this->kode_pos)
            && ! empty($this->latitude)
            && ! empty($this->longitude)
            && ! empty($this->email)
            && ! empty($this->website)
            && ! empty($this->npwp);
    }
}
