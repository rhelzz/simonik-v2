<?php

namespace App\Models;

use Database\Factories\SettingFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string|null $logo
 * @property string|null $favicon
 * @property string|null $background
 * @property string|null $text
 * @property string|null $whatsapp_number
 * @property string|null $whatsapp_message
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['logo', 'favicon', 'background', 'text', 'whatsapp_number', 'whatsapp_message'])]
class Setting extends Model
{
    /** @use HasFactory<SettingFactory> */
    use HasFactory;

    /**
     * Tautan `wa.me` siap-klik dengan pesan template ter-encode, atau null
     * kalau admin belum mengisi nomor WhatsApp CTA.
     *
     * Nomor dinormalisasi ke format internasional tanpa simbol (wa.me
     * mensyaratkan ini): `0` di depan diganti kode negara Indonesia `62`,
     * karakter selain digit dibuang.
     */
    public function whatsappCtaUrl(): ?string
    {
        if (blank($this->whatsapp_number)) {
            return null;
        }

        $digits = preg_replace('/\D/', '', $this->whatsapp_number) ?? '';
        $digits = str_starts_with($digits, '0') ? '62'.substr($digits, 1) : $digits;

        if ($digits === '') {
            return null;
        }

        $message = $this->whatsapp_message ?? '';

        return "https://wa.me/{$digits}?text=".urlencode($message);
    }
}
