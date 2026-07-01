<?php

namespace App\Models;

use Database\Factories\BudgetReceiptFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Penerimaan dana PKL (mis. anggaran komite) yang dicatat Wakasek.
 *
 * @property int $id
 * @property string $source
 * @property string|null $description
 * @property string $amount
 * @property Carbon $received_on
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['source', 'description', 'amount', 'received_on'])]
class BudgetReceipt extends Model
{
    /** @use HasFactory<BudgetReceiptFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'received_on' => 'date',
        ];
    }
}
