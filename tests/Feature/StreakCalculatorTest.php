<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\User;
use App\Services\StreakCalculator;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class StreakCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private StreakCalculator $calculator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->calculator = new StreakCalculator;
    }

    private function user(string $role): User
    {
        $user = User::factory()->create();
        $user->assignRole($role);

        return $user;
    }

    public function test_empty_activities_returns_zero_streaks(): void
    {
        $siswa = $this->user('siswa');
        $result = $this->calculator->calculate($siswa);

        $this->assertEquals(0, $result['current_streak']);
        $this->assertEquals(0, $result['longest_streak']);
    }

    public function test_consecutive_days_calculation(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');
        $siswa = $this->user('siswa');

        // Create journals for today, yesterday, and 2 days ago
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-07-01']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-30']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-29']);

        $result = $this->calculator->calculate($siswa);

        $this->assertEquals(3, $result['current_streak']);
        $this->assertEquals(3, $result['longest_streak']);
        Carbon::setTestNow();
    }

    public function test_streak_reset_due_to_gap(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');
        $siswa = $this->user('siswa');

        // Create journals for today, yesterday, then gap on June 29th, then journals on June 28th and 27th
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-07-01']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-30']);
        // Gap
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-28']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-27']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-26']);

        $result = $this->calculator->calculate($siswa);

        // Current streak should be 2 (today & yesterday)
        $this->assertEquals(2, $result['current_streak']);
        // Longest streak should be 3 (June 26 to 28)
        $this->assertEquals(3, $result['longest_streak']);
        Carbon::setTestNow();
    }

    public function test_old_activities_reset_current_streak_but_maintain_longest(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');
        $siswa = $this->user('siswa');

        // Activities in the past: 5, 4, and 3 days ago. No activities yesterday or today.
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-26']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-27']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-28']);

        $result = $this->calculator->calculate($siswa);

        // Current streak is 0 because they missed yesterday and today
        $this->assertEquals(0, $result['current_streak']);
        // Longest is still 3
        $this->assertEquals(3, $result['longest_streak']);
        Carbon::setTestNow();
    }

    public function test_duplicate_activities_on_same_day_count_as_one(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');
        $siswa = $this->user('siswa');

        // Two activities today, one yesterday
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-07-01', 'start_time' => '08:00', 'end_time' => '12:00']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-07-01', 'start_time' => '13:00', 'end_time' => '17:00']);
        Activity::factory()->create(['user_id' => $siswa->id, 'date' => '2026-06-30']);

        $result = $this->calculator->calculate($siswa);

        $this->assertEquals(2, $result['current_streak']);
        $this->assertEquals(2, $result['longest_streak']);
        Carbon::setTestNow();
    }
}
