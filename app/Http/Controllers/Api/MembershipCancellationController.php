<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppMembership;
use App\Models\Domain;
use Illuminate\Http\Request;

class MembershipCancellationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'email' => ['required', 'email'],
            'reason' => ['nullable', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();

        $membership = AppMembership::where('domain_id', $domain->id)
            ->where('email', strtolower($validated['email']))
            ->firstOrFail();

        $membership->update([
            'is_active' => false,
            'cancelled_at' => $membership->cancelled_at ?: now(),
            'cancellation_requested_at' => now(),
            'cancellation_reason' => $validated['reason'] ?? null,
            'cancellation_details' => $validated['details'] ?? null,
            'cancellation_source' => 'app',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Membership cancellation request saved.',
            'membership' => [
                'application_id' => $domain->application_id,
                'email' => $membership->email,
                'plan' => $membership->plan,
                'is_active' => $membership->is_active,
                'cancelled_at' => $membership->cancelled_at?->toIso8601String(),
                'cancellation_requested_at' => $membership->cancellation_requested_at?->toIso8601String(),
                'cancellation_reason' => $membership->cancellation_reason,
                'cancellation_details' => $membership->cancellation_details,
                'cancellation_source' => $membership->cancellation_source,
            ],
        ]);
    }
}
