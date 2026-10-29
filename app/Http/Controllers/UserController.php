<?php

namespace App\Http\Controllers;

use App\Http\Requests\BulkDestroyRequest;
use App\Models\User;
use App\Support\ImportDefaults;
use Database\Seeders\RoleSeeder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Tampilkan daftar user management untuk Admin.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $role = trim((string) $request->query('role', ''));

        $validRoles = RoleSeeder::ROLES;

        $users = User::query()
            ->with([
                'roles:id,name',
                'teachers.departements:id,name',
                'pembimbing',
                'parents',
                'students.classes:id,name',
                'departements:id,name,user_id',
            ])
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->when($role !== '' && in_array($role, $validRoles, true), function ($query) use ($role): void {
                $query->role($role);
            })
            ->latest('id')
            ->paginate(10)
            ->withQueryString()
            ->through(function (User $user): array {
                $roleNames = $user->roles->pluck('name')->all();

                $phone = $user->teachers?->no_hp
                    ?? $user->pembimbing?->no_hp
                    ?? $user->parents?->phoneNumber
                    ?? '-';

                $keterangan = match (true) {
                    in_array('kaprog', $roleNames, true) => $user->departements->isNotEmpty()
                        ? 'Kaprog: '.$user->departements->pluck('name')->join(', ')
                        : 'Kepala Program Keahlian',
                    in_array('guru', $roleNames, true) => $user->teachers?->departements
                        ? 'Guru: '.$user->teachers->departements->name
                        : 'Guru Pembimbing Sekolah',
                    in_array('pembimbing', $roleNames, true) => 'Pembimbing Industri DUDI',
                    in_array('siswa', $roleNames, true) => $user->students
                        ? 'Kelas '.($user->students->classes?->name ?? '-').($user->students->nis ? ' • NIS: '.$user->students->nis : '')
                        : 'Siswa PKL',
                    in_array('orangtua', $roleNames, true) => 'Orang Tua / Wali Siswa',
                    in_array('wakasek', $roleNames, true) => 'Wakasek Humas / Hubin',
                    in_array('admin', $roleNames, true) => 'Administrator Sistem',
                    default => '-',
                };

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $roleNames,
                    'password_masked' => '••••••••',
                    'no_hp' => $phone,
                    'keterangan' => $keterangan,
                    'created_at' => $user->created_at?->translatedFormat('d M Y'),
                ];
            });

        return Inertia::render('users/index', [
            'users' => $users,
            'filters' => [
                'search' => $search,
                'role' => $role,
            ],
            'availableRoles' => $validRoles,
        ]);
    }

    /**
     * Reset password user satuan ke default ('password').
     */
    public function resetPassword(User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Tidak dapat mereset password akun Anda sendiri.');
        }

        $user->update([
            'password' => Hash::make(ImportDefaults::PASSWORD),
        ]);

        return back()->with('success', "Password {$user->name} berhasil direset ke default (".ImportDefaults::PASSWORD.').');
    }

    /**
     * Reset password massal untuk user terpilih.
     */
    public function bulkResetPassword(BulkDestroyRequest $request): RedirectResponse
    {
        /** @var array<int, int> $ids */
        $ids = $request->validated('ids');
        $users = User::whereIn('id', $ids)->get();

        $resetCount = 0;
        DB::transaction(function () use ($users, &$resetCount): void {
            foreach ($users as $user) {
                if ($user->id === Auth::id()) {
                    continue;
                }
                $user->update([
                    'password' => Hash::make(ImportDefaults::PASSWORD),
                ]);
                $resetCount++;
            }
        });

        return back()->with('success', "Password {$resetCount} user berhasil direset ke default (".ImportDefaults::PASSWORD.').');
    }

    /**
     * Hapus akun user satuan.
     */
    public function destroy(User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        if ($user->teachers && $user->teachers->students()->exists()) {
            return back()->with('error', 'User tidak bisa dihapus karena masih membimbing siswa.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "Akun {$name} berhasil dihapus.");
    }

    /**
     * Hapus akun user massal.
     */
    public function bulkDestroy(BulkDestroyRequest $request): RedirectResponse
    {
        /** @var array<int, int> $ids */
        $ids = $request->validated('ids');
        $users = User::whereIn('id', $ids)->with('teachers')->get();

        $deleted = 0;
        $blocked = 0;

        DB::transaction(function () use ($users, &$deleted, &$blocked): void {
            foreach ($users as $user) {
                if ($user->id === Auth::id() || ($user->teachers && $user->teachers->students()->exists())) {
                    $blocked++;
                    continue;
                }
                $user->delete();
                $deleted++;
            }
        });

        $message = "{$deleted} akun berhasil dihapus.";
        if ($blocked > 0) {
            $message .= " {$blocked} akun dilewati (akun sendiri atau masih membimbing siswa).";
        }

        return back()->with('success', $message);
    }
}
