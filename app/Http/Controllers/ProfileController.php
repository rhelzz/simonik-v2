<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Halaman pengaturan akun (info akun + ganti sandi).
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('profile/edit', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    /**
     * Perbarui nama & email akun sendiri.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->update($request->validated());

        return back()->with('success', 'Profil berhasil diperbarui.');
    }
}
