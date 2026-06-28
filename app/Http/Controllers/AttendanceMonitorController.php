<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceMonitorController extends Controller
{
    /**
     * Rekap kehadiran siswa untuk dipantau staf (role-scoped).
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));
        $date = (string) $request->query('date', '');
        $status = (string) $request->query('status', '');

        $attendances = $this->scopedQuery($user)
            ->when($search !== '', fn (Builder $query) => $query->whereHas(
                'users.students',
                fn (Builder $student) => $student->where('name', 'like', "%{$search}%")
            ))
            ->when($date !== '', fn (Builder $query) => $query->whereDate('date', $date))
            ->when($status !== '', fn (Builder $query) => $query->where('status', $status))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Attendance $attendance): array => [
                'id' => $attendance->id,
                'date' => $attendance->date->format('Y-m-d'),
                'status' => $attendance->status,
                'arrivalTime' => $this->shortTime($attendance->arrivalTime),
                'departureTime' => $this->shortTime($attendance->departureTime),
                'student' => $attendance->users?->students?->name,
                'class' => $attendance->users?->students?->classes?->name,
                'verified' => $attendance->verified === '1',
            ]);

        return Inertia::render('attendance-monitor/index', [
            'attendances' => $attendances,
            'statuses' => $this->scopedQuery($user)
                ->whereNotNull('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->values(),
            'filters' => [
                'search' => $search,
                'date' => $date !== '' ? $date : null,
                'status' => $status !== '' ? $status : null,
            ],
            'can' => ['verify' => $user->hasAnyRole(['pembimbing', 'industri', 'mitra'])],
        ]);
    }

    /**
     * Detail satu catatan kehadiran.
     */
    public function show(Request $request, Attendance $attendance): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->scopedQuery($user)->whereKey($attendance->id)->exists(), 403);

        $attendance->load(['users.students.classes:id,name', 'users.students.industries:id,name']);

        return Inertia::render('attendance-monitor/show', [
            'attendance' => [
                'id' => $attendance->id,
                'date' => $attendance->date->format('Y-m-d'),
                'status' => $attendance->status,
                'arrivalTime' => $this->shortTime($attendance->arrivalTime),
                'departureTime' => $this->shortTime($attendance->departureTime),
                'absenceReason' => $attendance->absenceReason,
                'description' => $attendance->description,
                'image' => $attendance->image,
                'latitude' => $attendance->latitude,
                'longitude' => $attendance->longitude,
                'verified' => $attendance->verified === '1',
                'student' => $attendance->users?->students?->name,
                'class' => $attendance->users?->students?->classes?->name,
                'industry' => $attendance->users?->students?->industries?->name,
            ],
            'can' => ['verify' => $user->hasAnyRole(['pembimbing', 'industri', 'mitra'])],
        ]);
    }

    /**
     * Set / batalkan verifikasi kehadiran (pembimbing & industri).
     */
    public function verify(Request $request, Attendance $attendance): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->hasAnyRole(['pembimbing', 'industri', 'mitra']), 403);
        abort_unless($this->scopedQuery($user)->whereKey($attendance->id)->exists(), 403);

        $request->validate(['verified' => ['required', 'boolean']]);
        $verified = $request->boolean('verified');

        $attendance->update(['verified' => $verified ? '1' : '0']);

        return back()->with('success', $verified ? 'Kehadiran berhasil diverifikasi.' : 'Verifikasi kehadiran dibatalkan.');
    }

    /**
     * Query kehadiran yang boleh dilihat user sesuai perannya.
     *
     * @return Builder<Attendance>
     */
    private function scopedQuery(User $user): Builder
    {
        $query = Attendance::query()->with('users.students.classes:id,name');

        if ($user->hasAnyRole(['admin', 'kaprog'])) {
            return $query;
        }

        if ($user->hasRole('guru')) {
            return $query->whereHas(
                'users.students',
                fn (Builder $student) => $student->where('teacher_id', $user->teachers?->id)
            );
        }

        if ($user->hasRole('pembimbing')) {
            return $query->whereHas(
                'users.students.industries',
                fn (Builder $industry) => $industry->where('pembimbing_id', $user->pembimbing?->id)
            );
        }

        if ($user->hasAnyRole(['industri', 'mitra'])) {
            return $query->whereHas(
                'users.students.industries',
                fn (Builder $industry) => $industry->where('user_id', $user->id)
            );
        }

        return $query->whereRaw('1 = 0');
    }

    /**
     * Potong kolom time `HH:MM:SS` menjadi `HH:MM` (null aman).
     */
    private function shortTime(?string $time): ?string
    {
        return $time !== null ? mb_substr($time, 0, 5) : null;
    }
}
