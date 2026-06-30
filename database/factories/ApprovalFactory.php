<?php

namespace Database\Factories;

use App\Models\Approval;
use App\Models\Attendance;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Approval>
 */
class ApprovalFactory extends Factory
{
    public function definition(): array
    {
        $attendance = Attendance::factory()->create();

        return [
            'approvable_type' => Attendance::class,
            'approvable_id' => $attendance->id,
            'status' => Approval::STATUS_PENDING,
            'approver_role' => null,
            'approver_id' => null,
            'note' => null,
        ];
    }

    public function approved(): static
    {
        return $this->state(['status' => Approval::STATUS_APPROVED]);
    }

    public function rejected(): static
    {
        return $this->state(['status' => Approval::STATUS_REJECTED]);
    }
}
