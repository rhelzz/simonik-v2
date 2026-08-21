<?php

namespace App\Models;

use App\Support\TagName;
use Database\Factories\PostFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property string $title
 * @property string $content
 * @property bool $important
 * @property bool $is_closed
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id', 'title', 'content', 'important', 'is_closed'])]
class Post extends Model
{
    /** @use HasFactory<PostFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'important' => 'boolean',
            'is_closed' => 'boolean',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** @return HasMany<Comment, $this> */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /** @return BelongsToMany<Tag, $this> */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Thread yang memuat tag tertentu. Disaring di SQL (bukan di PHP) supaya
     * daftarnya tetap bisa dipaginasi database — inilah alasan tag disimpan
     * ternormalisasi, bukan sebagai kolom JSON.
     *
     * @param  Builder<Post>  $query
     * @return Builder<Post>
     */
    public function scopeWithTag(Builder $query, ?string $tag): Builder
    {
        if ($tag === null || $tag === '') {
            return $query;
        }

        return $query->whereHas(
            'tags',
            fn (Builder $tags): Builder => $tags->where('name', TagName::normalise($tag)),
        );
    }
}
