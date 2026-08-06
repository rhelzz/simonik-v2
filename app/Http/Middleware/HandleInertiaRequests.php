<?php

namespace App\Http\Middleware;

use App\Models\Approval;
use App\Models\Industry;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->getRoleNames() ?? [],
                'pendingApprovalsCount' => function () use ($request) {
                    $user = $request->user();
                    if (! $user || ! $user->hasAnyRole(['pembimbing', 'guru', 'kaprog', 'orangtua'])) {
                        return 0;
                    }

                    return Approval::query()
                        ->forUserQueue($user)
                        ->where('status', Approval::STATUS_PENDING)
                        ->count();
                },
                'accountNotice' => fn () => $this->accountNotice($request),
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * Peringatan bahwa akun guru/pembimbing belum tertaut ke industri manapun.
     *
     * Tanpa tautan ini `ScopesStudentsByRole` mengembalikan query kosong, jadi
     * seluruh halaman (murid, nilai, absen, inbox persetujuan, sertifikat)
     * tampil kosong dan terbaca seperti fiturnya belum jadi. Ditampilkan
     * sebagai spanduk global agar penyebabnya jelas, bukan ditebak.
     */
    private function accountNotice(Request $request): ?string
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        // Satu akun bisa memegang beberapa jabatan sekaligus, jadi kumpulkan
        // peringatan untuk semuanya — memakai `return` pada jabatan pertama
        // akan menyembunyikan masalah jabatan berikutnya.
        $notices = [];

        if ($user->hasRole('guru')) {
            $teacherId = $user->teachers?->id;

            if ($teacherId === null) {
                $notices[] = 'Akun Anda belum memiliki data Guru Pembimbing. Hubungi admin sekolah agar akun ini dilengkapi, karena tanpa itu daftar siswa bimbingan, nilai, dan inbox persetujuan akan tetap kosong.';
            } elseif (! Industry::query()->where('teacher_id', $teacherId)->exists()) {
                $notices[] = 'Anda belum ditugaskan sebagai guru pembimbing di industri manapun. Hubungi admin atau Kepala Program untuk menetapkan industri bimbingan Anda — sampai itu dilakukan, daftar siswa, nilai, absensi, dan inbox persetujuan akan kosong.';
            }
        }

        if ($user->hasRole('pembimbing')) {
            $pembimbingId = $user->pembimbing?->id;

            if ($pembimbingId === null) {
                $notices[] = 'Akun Anda belum memiliki data Pembimbing Industri. Hubungi admin sekolah agar akun ini dilengkapi, karena tanpa itu profil industri dan daftar anak magang tidak dapat ditampilkan.';
            } elseif (! Industry::query()->where('pembimbing_id', $pembimbingId)->exists()) {
                $notices[] = 'Akun Anda belum ditautkan ke industri manapun. Hubungi admin atau Kepala Program untuk menetapkan industri Anda — sampai itu dilakukan, profil industri, titik absensi, jam kerja, daftar anak magang, penilaian, dan sertifikat tidak dapat dipakai.';
            }
        }

        return $notices === [] ? null : implode(' ', $notices);
    }
}
