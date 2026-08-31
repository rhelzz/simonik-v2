<?php

namespace App\Http\Controllers;

use App\Http\Requests\WebsiteSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pengaturan favicon situs (admin) yang dipakai di seluruh halaman.
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
}
