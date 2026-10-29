<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdatePopupSettingRequest;
use App\Http\Requests\WebsiteSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pengaturan favicon situs & pop up dinamis (admin).
 */
class WebsiteSettingController extends Controller
{
    public function edit(): Response
    {
        $setting = Setting::query()->firstOrCreate([]);

        return Inertia::render('website-settings/edit', [
            'favicon' => [
                'url' => asset($setting->favicon ?? 'favicon.ico').'?v='.$setting->updated_at?->timestamp,
                'updatedAt' => $setting->updated_at,
            ],
            'popup' => [
                'popup_active' => (bool) $setting->popup_active,
                'popup_icon' => $setting->popup_icon ?? 'smartphone',
                'popup_title' => $setting->popup_title ?? 'Informasi Penting!',
                'popup_description' => $setting->popup_description ?? 'Dapatkan update terbaru dengan mengunduh aplikasi resmi kami langsung di perangkat Anda!',
                'popup_has_button' => (bool) ($setting->popup_has_button ?? true),
                'popup_button_text' => $setting->popup_button_text ?? 'Unduh Sekarang',
                'popup_button_url' => $setting->popup_button_url ?? '',
                'popup_interval_minutes' => (int) ($setting->popup_interval_minutes ?? 5),
            ],
        ]);
    }

    public function update(WebsiteSettingRequest $request): RedirectResponse
    {
        $setting = Setting::query()->firstOrCreate([]);

        $file = $request->file('favicon');
        $favicon = 'favicon.'.strtolower($file->getClientOriginalExtension());

        $file->move(public_path(), $favicon);

        $setting->update(['favicon' => $favicon]);

        return back()->with('success', 'Favicon berhasil diperbarui.');
    }

    public function updatePopup(UpdatePopupSettingRequest $request): RedirectResponse
    {
        $setting = Setting::query()->firstOrCreate([]);
        $setting->update($request->validated());

        return back()->with('success', 'Pengaturan pop up dinamis berhasil disimpan.');
    }
}
