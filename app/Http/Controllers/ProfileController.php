<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Requests\UpdateStudentProfileRequest;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Halaman pengaturan akun (info akun + ganti sandi + data diri siswa).
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $student = $user->hasRole('siswa') ? $user->students : null;

        return Inertia::render('profile/edit', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'student' => $student ? [
                'nis' => $student->nis,
                'placeOfBirth' => $student->placeOfBirth,
                'dateOfBirth' => $student->dateOfBirth?->format('Y-m-d'),
                'gender' => $student->gender,
                'bloodType' => $student->bloodType,
                'alamat' => $student->alamat,
                'image' => $student->image,
                'complete' => $student->hasCompleteProfile(),
            ] : null,
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

    /**
     * Siswa melengkapi data dirinya sendiri. Diambil dari `$request->user()`,
     * bukan route-model-binding — tidak ada id di URL yang bisa ditebak untuk
     * mengedit data diri siswa lain.
     */
    public function updateStudentProfile(UpdateStudentProfileRequest $request): RedirectResponse
    {
        /** @var Student|null $student */
        $student = $request->user()->students;

        abort_unless($student !== null, 404);

        $data = $request->validated();

        if ($request->hasFile('image')) {
            $path = $student->getRawOriginal('image');

            if ($path) {
                Storage::disk('public')->delete($path);
            }

            $data['image'] = $request->file('image')->store('students', 'public');
        }

        $student->update($data);

        return back()->with('success', 'Data diri berhasil diperbarui.');
    }
}
