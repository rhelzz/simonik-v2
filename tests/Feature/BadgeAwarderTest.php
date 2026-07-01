<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Attendance;
use App\Models\Badge;
use App\Models\Student;
use App\Models\User;
use App\Services\BadgeAwarder;
use Database\Seeders\BadgeSeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class BadgeAwarderTest extends TestCase
{
    use RefreshDatabase;

    private BadgeAwarder $awarder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(BadgeSeeder::class);
        $this->awarder = $this->app->make(BadgeAwarder::class);
    }

    private function makeStudent(): array
    {
        $user = User::factory()->create();
        $user->assignRole('siswa');
        $student = Student::factory()->create(['user_id' => $user->id]);

        return [$user, $student];
    }

    public function test_no_badges_awarded_without_activity(): void
    {
        [$user, $student] = $this->makeStudent();

        $this->awarder->checkAndAward($user);

        $this->assertCount(0, $student->badges()->get());
    }

    public function test_streak_7_badge_awarded_when_streak_meets_threshold(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');
        [$user, $student] = $this->makeStudent();

        // 7 consecutive days ending today
        foreach (range(6, 0) as $back) {
            Activity::factory()->create([
                'user_id' => $user->id,
                'date' => Carbon::today()->subDays($back)->toDateString(),
            ]);
        }

        $this->awarder->checkAndAward($user);

        $badge = Badge::where('key', 'streak_7')->first();
        $this->assertTrue($student->badges()->where('badges.id', $badge->id)->exists());
        Carbon::setTestNow();
    }

    public function test_streak_7_badge_not_awarded_when_streak_below_threshold(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');
        [$user, $student] = $this->makeStudent();

        // Only 5 consecutive days
        foreach (range(4, 0) as $back) {
            Activity::factory()->create([
                'user_id' => $user->id,
                'date' => Carbon::today()->subDays($back)->toDateString(),
            ]);
        }

        $this->awarder->checkAndAward($user);

        $badge = Badge::where('key', 'streak_7')->first();
        $this->assertFalse($student->badges()->where('badges.id', $badge->id)->exists());
        Carbon::setTestNow();
    }

    public function test_total_journal_badge_awarded_when_total_meets_threshold(): void
    {
        [$user, $student] = $this->makeStudent();

        // 10 journals
        Activity::factory()->count(10)->create(['user_id' => $user->id]);

        $this->awarder->checkAndAward($user);

        $badge = Badge::where('key', 'journal_10')->first();
        $this->assertTrue($student->badges()->where('badges.id', $badge->id)->exists());
    }

    public function test_total_attendance_badge_awarded_when_hadir_meets_threshold(): void
    {
        [$user, $student] = $this->makeStudent();

        // 5 hadir records
        foreach (range(1, 5) as $i) {
            Attendance::factory()->create([
                'user_id' => $user->id,
                'status' => 'hadir',
                'date' => '2026-06-'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
            ]);
        }

        $this->awarder->checkAndAward($user);

        $badge = Badge::where('key', 'attendance_5')->first();
        $this->assertTrue($student->badges()->where('badges.id', $badge->id)->exists());
    }

    public function test_award_is_idempotent(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');
        [$user, $student] = $this->makeStudent();

        Activity::factory()->count(10)->create(['user_id' => $user->id]);

        $this->awarder->checkAndAward($user);
        $this->awarder->checkAndAward($user); // call twice

        $badge = Badge::where('key', 'journal_10')->first();
        $this->assertCount(1, $student->badges()->where('badges.id', $badge->id)->get());
        Carbon::setTestNow();
    }

    public function test_badge_awarded_automatically_after_store_activity(): void
    {
        Carbon::setTestNow('2026-07-01 10:00:00');

        $user = User::factory()->create();
        $user->assignRole('siswa');
        $student = Student::factory()->create(['user_id' => $user->id]);

        // Pre-seed 9 journals so the 10th triggers the badge
        Activity::factory()->count(9)->create(['user_id' => $user->id]);

        $this->actingAs($user)->post(route('activities.store'), [
            'judul' => 'Jurnal ke-10',
            'date' => '2026-07-01',
            'start_time' => '08:00',
            'end_time' => '16:00',
            'description' => '<p>Test</p>',
            'tools' => 'PHP',
        ]);

        $badge = Badge::where('key', 'journal_10')->first();
        $this->assertTrue($student->fresh()->badges()->where('badges.id', $badge->id)->exists());
        Carbon::setTestNow();
    }

    public function test_user_without_student_profile_does_not_cause_error(): void
    {
        $user = User::factory()->create();
        $user->assignRole('guru');

        // Should return without throwing
        $this->awarder->checkAndAward($user);

        $this->assertTrue(true);
    }
}
