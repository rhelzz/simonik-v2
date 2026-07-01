<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Attendance;
use App\Models\Badge;
use App\Models\User;
use App\Services\StreakCalculator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StreakController extends Controller
{
    public function __construct(
        private readonly StreakCalculator $streakCalculator,
    ) {}

    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $userId = (int) $user->id;

        $streaks = $this->streakCalculator->calculate($user);

        $student = $user->students;
        $allBadges = Badge::all();

        $pivotRows = $student !== null
            ? \DB::table('student_badge')
                ->where('student_id', $student->id)
                ->get(['badge_id', 'awarded_at'])
                ->keyBy('badge_id')
            : collect();

        $badges = $allBadges->map(fn (Badge $b) => [
            'id' => $b->id,
            'key' => $b->key,
            'name' => $b->name,
            'description' => $b->description,
            'icon' => $b->icon,
            'color' => $b->color,
            'rule_type' => $b->rule_type,
            'rule_value' => $b->rule_value,
            'earned' => $pivotRows->has($b->id),
            'awarded_at' => $pivotRows->has($b->id)
                ? (string) $pivotRows->get($b->id)->awarded_at
                : null,
        ])->values()->all();

        return Inertia::render('streak', [
            'streak' => [
                'current' => $streaks['current_streak'],
                'longest' => $streaks['longest_streak'],
            ],
            'stats' => [
                'total_journal' => Activity::query()->where('user_id', $userId)->count(),
                'total_attendance' => Attendance::query()
                    ->where('user_id', $userId)
                    ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
                    ->count(),
            ],
            'badges' => $badges,
        ]);
    }
}
