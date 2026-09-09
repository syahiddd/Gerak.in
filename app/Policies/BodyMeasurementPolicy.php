<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\BodyMeasurement;
use App\Models\User;

class BodyMeasurementPolicy
{
    public function view(User $user, BodyMeasurement $m): bool
    {
        return (int) $m->user_id === (int) $user->id;
    }

    public function update(User $user, BodyMeasurement $m): bool
    {
        return (int) $m->user_id === (int) $user->id;
    }

    public function delete(User $user, BodyMeasurement $m): bool
    {
        return (int) $m->user_id === (int) $user->id;
    }
}
