<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Carbon;

class StreakCalculator
{
    /**
     * Hitung daily streak & longest streak dari activities milik user tertentu.
     *
     * @return array{current_streak: int, longest_streak: int}
     */
    public function calculate(User $user): array
    {
        $dateStrings = $user->activities()
            ->orderBy('date', 'asc')
            ->pluck('date')
            ->map(fn ($d) => Carbon::parse($d)->format('Y-m-d'))
            ->unique()
            ->values()
            ->all();

        if (empty($dateStrings)) {
            return [
                'current_streak' => 0,
                'longest_streak' => 0,
            ];
        }

        $dates = array_map(fn ($ds) => Carbon::parse($ds)->startOfDay(), $dateStrings);
        $count = count($dates);

        $longest = 1;
        $tempStreak = 1;

        for ($i = 1; $i < $count; $i++) {
            $prevDate = $dates[$i - 1];
            $currDate = $dates[$i];

            if ((int) abs($currDate->diffInDays($prevDate)) === 1) {
                $tempStreak++;
            } else {
                $tempStreak = 1;
            }

            if ($tempStreak > $longest) {
                $longest = $tempStreak;
            }
        }

        $lastDate = end($dates);
        $today = Carbon::today()->startOfDay();
        $yesterday = Carbon::yesterday()->startOfDay();

        $current = 0;
        if ($lastDate->equalTo($today) || $lastDate->equalTo($yesterday)) {
            $current = 1;
            for ($i = $count - 2; $i >= 0; $i--) {
                $prevDate = $dates[$i + 1];
                $currDate = $dates[$i];

                if ((int) abs($prevDate->diffInDays($currDate)) === 1) {
                    $current++;
                } else {
                    break;
                }
            }
        }

        return [
            'current_streak' => $current,
            'longest_streak' => $longest,
        ];
    }
}
