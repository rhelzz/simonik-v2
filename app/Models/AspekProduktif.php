<?php

namespace App\Models;

use Database\Factories\AspekProduktifFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Master aspek penilaian PKL (di-CRUD admin). Tiap aspek punya kategori
 * teknis / non-teknis, nomor urut tampilan, dan deskripsi kemampuan.
 *
 * @property int $id
 * @property string $category
 * @property int $no
 * @property string $kemampuan
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['category', 'no', 'kemampuan'])]
class AspekProduktif extends Model
{
    /** @use HasFactory<AspekProduktifFactory> */
    use HasFactory;

    public const CATEGORY_TEKNIS = 'teknis';

    public const CATEGORY_NON_TEKNIS = 'non_teknis';

    /** @var list<string> */
    public const CATEGORIES = [self::CATEGORY_TEKNIS, self::CATEGORY_NON_TEKNIS];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'no' => 'integer',
        ];
    }

    /** @return HasMany<Evaluation, $this> */
    public function evaluations(): HasMany
    {
        return $this->hasMany(Evaluation::class);
    }
}
