<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityMonitorController extends Controller
{
    /**
     * Daftar jurnal kegiatan siswa untuk dipantau staf (role-scoped).
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $search = trim((string) $request->query('search', ''));
        $date = (string) $request->query('date', '');

        $activities = $this->scopedQuery($user)
            ->when($search !== '', fn (Builder $query) => $query->whereHas(
                'users.students',
                fn (Builder $student) => $student->where('name', 'like', "%{$search}%")
            ))
            ->when($date !== '', fn (Builder $query) => $query->whereDate('date', $date))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Activity $activity): array => [
                'id' => $activity->id,
                'judul' => $activity->judul,
                'date' => $activity->date->format('Y-m-d'),
                'student' => $activity->users?->students?->name,
                'class' => $activity->users?->students?->classes?->name,
                'tools' => $activity->tools,
                'verified' => $activity->verified === '1',
            ]);

        return Inertia::render('activity-monitor/index', [
            'activities' => $activities,
            'filters' => ['search' => $search, 'date' => $date !== '' ? $date : null],
            'can' => ['verify' => $user->hasAnyRole(['pembimbing', 'industri', 'mitra'])],
        ]);
    }

    /**
     * Detail satu jurnal kegiatan.
     */
    public function show(Request $request, Activity $activity): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($this->scopedQuery($user)->whereKey($activity->id)->exists(), 403);

        $activity->load(['users.students.classes:id,name', 'users.students.industries:id,name']);

        return Inertia::render('activity-monitor/show', [
            'activity' => [
                'id' => $activity->id,
                'judul' => $activity->judul,
                'date' => $activity->date->format('Y-m-d'),
                'start_time' => mb_substr($activity->start_time, 0, 5),
                'end_time' => mb_substr($activity->end_time, 0, 5),
                'description' => $activity->description,
                'tools' => $activity->tools,
                'image' => $activity->image,
                'verified' => $activity->verified === '1',
                'student' => $activity->users?->students?->name,
                'class' => $activity->users?->students?->classes?->name,
                'industry' => $activity->users?->students?->industries?->name,
            ],
            'can' => ['verify' => $user->hasAnyRole(['pembimbing', 'industri', 'mitra'])],
        ]);
    }

    /**
     * Set / batalkan verifikasi jurnal (pembimbing & industri).
     */
    public function verify(Request $request, Activity $activity): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->hasAnyRole(['pembimbing', 'industri', 'mitra']), 403);
        abort_unless($this->scopedQuery($user)->whereKey($activity->id)->exists(), 403);

        $request->validate(['verified' => ['required', 'boolean']]);
        $verified = $request->boolean('verified');

        $activity->update(['verified' => $verified ? '1' : '0']);

        return back()->with('success', $verified ? 'Jurnal berhasil diverifikasi.' : 'Verifikasi jurnal dibatalkan.');
    }

    /**
     * Query jurnal yang boleh dilihat user sesuai perannya.
     *
     * @return Builder<Activity>
     */
    private function scopedQuery(User $user): Builder
    {
        $query = Activity::query()->with('users.students.classes:id,name');

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
}
