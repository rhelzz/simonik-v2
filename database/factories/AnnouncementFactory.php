<?php

namespace Database\Factories;

use App\Models\Announcement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends Factory<Announcement>
 */
class AnnouncementFactory extends Factory
{
    protected $model = Announcement::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'body' => '<p>'.fake()->paragraph().'</p>',
            'roles' => [Announcement::ALL_ROLES],
            'starts_at' => Carbon::today(),
            'ends_at' => Carbon::today()->addWeek(),
        ];
    }
}
