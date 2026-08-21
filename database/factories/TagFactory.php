<?php

namespace Database\Factories;

use App\Models\Tag;
use App\Support\TagName;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tag>
 */
class TagFactory extends Factory
{
    protected $model = Tag::class;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => TagName::normalise(fake()->unique()->word()),
            'is_suggested' => false,
        ];
    }

    public function suggested(): static
    {
        return $this->state(fn (): array => ['is_suggested' => true]);
    }
}
