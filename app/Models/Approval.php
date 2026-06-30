<?php

namespace App\Models;

use Database\Factories\ApprovalFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
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
}
