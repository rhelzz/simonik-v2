<?php

namespace App\Policies;

use App\Actions\ApproveRequest;
use App\Models\Approval;
use App\Models\User;

class ApprovalPolicy
{
    public function act(User $user, Approval $approval): bool
    {
        return app(ApproveRequest::class)->canAct($approval, $user);
    }
}
