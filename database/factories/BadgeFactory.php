<?php

namespace Database\Factories;

use App\Models\Badge;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Badge>
 */
class BadgeFactory extends Factory
{
    protected $model = Badge::class;

    public function definition(): array
    {
        $ruleType = $this->faker->randomElement(Badge::RULE_TYPES);

        return [
            'key' => $this->faker->unique()->slug(2),
            'name' => $this->faker->words(2, true),
            'description' => $this->faker->sentence(),
            'icon' => '🏅',
            'color' => 'bg-amber-500/10 text-amber-600',
            'rule_type' => $ruleType,
            'rule_value' => $this->faker->numberBetween(1, 30),
        ];
    }

    public function streakJournal(int $value): static
    {
        return $this->state([
            'rule_type' => Badge::RULE_STREAK_JOURNAL,
            'rule_value' => $value,
        ]);
    }

    public function totalJournal(int $value): static
    {
        return $this->state([
            'rule_type' => Badge::RULE_TOTAL_JOURNAL,
            'rule_value' => $value,
        ]);
    }

    public function totalAttendance(int $value): static
    {
        return $this->state([
            'rule_type' => Badge::RULE_TOTAL_ATTENDANCE,
            'rule_value' => $value,
        ]);
    }
}
