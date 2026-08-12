<?php

namespace App\Http\Controllers;

use App\Http\Requests\WhatsappCtaSettingRequest;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Pengaturan tombol CTA WhatsApp di landing page (admin): nomor tujuan +
 * template pesan yang otomatis terisi saat pengunjung mengklik tombol,
 * supaya balasan admin/sekolah sudah tahu konteks awal chat itu.
 */
class WhatsappCtaSettingController extends Controller
{
    private const DEFAULT_MESSAGE = 'Halo, saya membuka aplikasi PKL Murid SMK dan ingin berdiskusi dengan Anda mengenai ';

    public function edit(): Response
    {
        $setting = Setting::query()->firstOrCreate([]);

        return Inertia::render('whatsapp-cta/edit', [
            'whatsapp' => [
                'number' => $setting->whatsapp_number,
                'message' => $setting->whatsapp_message ?? self::DEFAULT_MESSAGE,
            ],
        ]);
    }

    public function update(WhatsappCtaSettingRequest $request): RedirectResponse
    {
        $setting = Setting::query()->firstOrCreate([]);

        $setting->update($request->validated());

        return back()->with('success', 'CTA WhatsApp berhasil diperbarui.');
    }
}
