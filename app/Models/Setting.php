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
 * @property bool $popup_active
 * @property string $popup_icon
 * @property string|null $popup_title
 * @property string|null $popup_description
 * @property bool $popup_has_button
 * @property string|null $popup_button_text
 * @property string|null $popup_button_url
 * @property int $popup_interval_minutes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'logo',
    'favicon',
    'background',
    'text',
    'whatsapp_number',
    'whatsapp_message',
    'popup_active',
    'popup_icon',
    'popup_title',
    'popup_description',
    'popup_has_button',
    'popup_button_text',
    'popup_button_url',
    'popup_interval_minutes',
])]
class Setting extends Model
{
    /** @use HasFactory<SettingFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'popup_active' => 'boolean',
            'popup_has_button' => 'boolean',
            'popup_interval_minutes' => 'integer',
        ];
    }

    /**
     * Data konfigurasi popup dinamis.
     *
     * @return array<string, mixed>
     */
    public function dynamicPopupData(): array
    {
        return [
            'active' => (bool) $this->popup_active,
            'icon' => $this->popup_icon ?: 'smartphone',
            'title' => $this->popup_title ?: 'Informasi Penting!',
            'description' => $this->popup_description ?: '',
            'has_button' => (bool) $this->popup_has_button,
            'button_text' => $this->popup_button_text ?: 'Unduh Sekarang',
            'button_url' => $this->popup_button_url ?: '#',
            'interval_minutes' => (int) ($this->popup_interval_minutes ?? 5),
        ];
    }

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
