<?php

namespace App\Models;

use Database\Factories\ApprovalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $approvable_type
 * @property int $approvable_id
 * @property string $status
 * @property string|null $approver_role
 * @property int|null $approver_id
 * @property string|null $note
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'approvable_type',
    'approvable_id',
    'status',
    'approver_role',
    'approver_id',
    'note',
])]
class Approval extends Model
{
    /** @use HasFactory<ApprovalFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    // Roles eligible to act on an approval (First-to-Approve).
    public const PRIMARY_ROLES = ['pembimbing', 'guru'];

    public const FALLBACK_ROLE = 'kaprog';

    /** @var array<int, string> */
    public const ELIGIBLE_ROLES = ['pembimbing', 'guru', 'kaprog'];

    /** @return MorphTo<Model, $this> */
    public function approvable(): MorphTo
    {
        return $this->morphTo();
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Buat approval berstatus pending untuk approvable tertentu.
     */
    public static function initiate(Model $approvable): self
    {
        return self::create([
            'approvable_type' => $approvable::class,
            'approvable_id' => $approvable->getKey(),
            'status' => self::STATUS_PENDING,
        ]);
    }

    /**
     * Scope query approvals yang dapat diproses oleh user tertentu.
     *
     * @param  Builder<Approval>  $query
     * @return Builder<Approval>
     */
    public function scopeForUserQueue(Builder $query, User $user): Builder
    {
        $studentUserIdsQuery = Student::query()->select('user_id');

        if ($user->hasRole('guru')) {
            $teacherId = $user->teachers?->id;
            if (! $teacherId) {
                return $query->whereRaw('1 = 0');
            }
            $studentUserIdsQuery->whereIn('industri_id', function ($q) use ($teacherId) {
                $q->select('id')->from('industries')->where('teacher_id', $teacherId);
            });
        } elseif ($user->hasRole('pembimbing')) {
            $pembimbingId = $user->pembimbing?->id;
            if (! $pembimbingId) {
                return $query->whereRaw('1 = 0');
            }
            $studentUserIdsQuery->whereIn('industri_id', function ($q) use ($pembimbingId) {
                $q->select('id')->from('industries')->where('pembimbing_id', $pembimbingId);
            });
        } elseif ($user->hasRole('siswa')) {
            $studentUserIdsQuery->where('user_id', $user->id);
        }

        // Orang Tua tidak lagi punya antrean persetujuan sejak Fase 26 —
        // cabangnya dihapus, bukan disisakan sebagai kode mati.
        if (! $user->hasAnyRole(['admin', 'kaprog', 'wakasek', 'guru', 'pembimbing', 'siswa'])) {
            return $query->whereRaw('1 = 0');
        }

        // Sejak v2.4 Fase 26, Sakit/Izin hanya satu tahap: approval pending
        // SELALU berarti "menunggu Guru/Industri/Kaprog". Tahap Orang Tua
        // dihapus, sehingga cabang SakitIzin diperlakukan seragam dengan
        // LeaveRequest & Attendance — tanpa cek pendahulu sama sekali.
        $query->where(function ($q) use ($user, $studentUserIdsQuery) {
            if (! $user->hasAnyRole(self::ELIGIBLE_ROLES)) {
                $q->whereRaw('1 = 0');

                return;
            }

            $q->where(function ($sub) use ($studentUserIdsQuery) {
                $sub->where('approvable_type', SakitIzin::class)
                    ->whereIn('approvable_id', function ($q2) use ($studentUserIdsQuery) {
                        $q2->select('id')
                            ->from('sakit_izins')
                            ->whereIn('user_id', $studentUserIdsQuery);
                    });
            })->orWhere(function ($sub) use ($studentUserIdsQuery) {
                $sub->where('approvable_type', LeaveRequest::class)
                    ->whereIn('approvable_id', function ($q2) use ($studentUserIdsQuery) {
                        $q2->select('id')
                            ->from('leave_requests')
                            ->whereIn('user_id', $studentUserIdsQuery);
                    });
            })->orWhere(function ($sub) use ($studentUserIdsQuery) {
                $sub->where('approvable_type', Attendance::class)
                    ->whereIn('approvable_id', function ($q2) use ($studentUserIdsQuery) {
                        $q2->select('id')
                            ->from('attendances')
                            ->whereIn('user_id', $studentUserIdsQuery);
                    });
            });
        });

        return $query;
    }
}
