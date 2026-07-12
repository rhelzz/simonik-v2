<?php

namespace App\Http\Controllers;

use App\Http\Requests\WebsiteSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pengaturan favicon situs (admin): satu berkas favicon.ico yang dipakai
 * di seluruh halaman lewat <link> statis di app.blade.php.
 */
class WebsiteSettingController extends Controller
{
    public function edit(): Response
    {
        $setting = Setting::query()->firstOrCreate([]);

        return Inertia::render('website-settings/edit', [
            'favicon' => [
                'url' => asset('favicon.ico').'?v='.$setting->updated_at?->timestamp,
                'updatedAt' => $setting->updated_at,
            ],
        ]);
    }

    public function update(WebsiteSettingRequest $request): RedirectResponse
    {
        $setting = Setting::query()->firstOrCreate([]);

        $request->file('favicon')->move(public_path(), 'favicon.ico');

        $setting->update(['favicon' => 'favicon.ico']);

        return back()->with('success', 'Favicon berhasil diperbarui.');
    }
}
