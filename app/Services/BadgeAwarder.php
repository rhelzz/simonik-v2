<?php

namespace App\Services;

use App\Models\Badge;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Carbon;

class BadgeAwarder
{
    public function __construct(
        private readonly StreakCalculator $streakCalculator
    ) {}

    /**
     * Evaluasi semua badge dan award yang belum diraih siswa.
     * Idempotent — memanggil berkali-kali aman karena pivot unique(student_id, badge_id).
     */
    public function checkAndAward(User $user): void
    {
        $student = $user->students;
        if ($student === null) {
            return;
        }

        $badges = Badge::all();
        if ($badges->isEmpty()) {
            return;
        }

        $stats = $this->buildStats($user, $student);
        $earnedIds = $student->badges()->pluck('badges.id')->all();

        $toAward = $badges
            ->reject(fn (Badge $b) => \in_array($b->id, $earnedIds, true))
            ->filter(fn (Badge $b) => $this->meetsRule($b, $stats));

        foreach ($toAward as $badge) {
            $student->badges()->attach($badge->id, ['awarded_at' => Carbon::now()]);
        }
    }

    /**
     * Kumpulkan statistik siswa yang dibutuhkan untuk evaluasi badge.
     *
     * @return array{current_streak: int, longest_streak: int, total_journal: int, total_attendance: int}
     */
    private function buildStats(User $user, Student $student): array
    {
        $streaks = $this->streakCalculator->calculate($user);

        $totalJournal = $user->activities()->count();

        $totalAttendance = $user->attendances()
            ->whereRaw('LOWER(status) in (?, ?)', ['hadir', 'masuk'])
            ->count();

        return [
            'current_streak' => $streaks['current_streak'],
            'longest_streak' => $streaks['longest_streak'],
            'total_journal' => $totalJournal,
            'total_attendance' => $totalAttendance,
        ];
    }

    /**
     * Apakah statistik memenuhi aturan badge ini?
     *
     * @param  array{current_streak: int, longest_streak: int, total_journal: int, total_attendance: int}  $stats
     */
    private function meetsRule(Badge $badge, array $stats): bool
    {
        return match ($badge->rule_type) {
            Badge::RULE_STREAK_JOURNAL => $stats['current_streak'] >= $badge->rule_value,
            Badge::RULE_TOTAL_JOURNAL => $stats['total_journal'] >= $badge->rule_value,
            Badge::RULE_TOTAL_ATTENDANCE => $stats['total_attendance'] >= $badge->rule_value,
            default => false,
        };
    }
}
