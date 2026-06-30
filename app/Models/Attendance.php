<?php

namespace App\Models;

use Database\Factories\AttendanceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property Carbon $date
 * @property string|null $departureTime
 * @property string|null $arrivalTime
 * @property string|null $absenceReason
 * @property string|null $image
 * @property string|null $emotion
 * @property string|null $departure_image
 * @property string|null $departure_emotion
 * @property string|null $longitude
 * @property string|null $latitude
 * @property string|null $status
 * @property string|null $mode
 * @property bool $is_late
 * @property int|null $distance_m
 * @property float|null $gps_accuracy
 * @property bool $is_suspect
 * @property string|null $description
 * @property string|null $verified
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'date',
    'departureTime',
    'arrivalTime',
    'absenceReason',
    'image',
    'emotion',
    'departure_image',
    'departure_emotion',
    'longitude',
    'latitude',
    'status',
    'mode',
    'is_late',
    'distance_m',
    'gps_accuracy',
    'is_suspect',
    'description',
    'verified',
])]
class Attendance extends Model
{
    /** @use HasFactory<AttendanceFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
            'is_late' => 'boolean',
            'is_suspect' => 'boolean',
            'distance_m' => 'integer',
            'gps_accuracy' => 'float',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function users(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Akses URL publik gambar absensi dari path yang tersimpan.
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
     * Akses URL publik foto absen pulang.
     *
     * @return Attribute<string|null, never>
     */
    protected function departureImage(): Attribute
    {
        return Attribute::make(
            get: fn (?string $value): ?string => $value ? asset("/storage/{$value}") : null,
        );
    }
}
