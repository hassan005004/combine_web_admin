<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppMembership;
use App\Models\Domain;
use App\Services\EntitySmtpMailer;
use App\Services\GooglePlaySubscriptionVerifier;
use Illuminate\Http\Request;

class MembershipCancellationController extends Controller
{
    public function store(Request $request, GooglePlaySubscriptionVerifier $googlePlay)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'device_id' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'reason' => ['nullable', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $deviceId = trim($validated['device_id']);
        $email = isset($validated['email']) ? strtolower($validated['email']) : null;

        $membership = AppMembership::where('domain_id', $domain->id)
            ->where(function ($query) use ($deviceId, $email) {
                $query->where('device_id', $deviceId);

                if ($email) {
                    $query->orWhere('email', $email);
                }
            })
            ->latest()
            ->firstOrFail();

        $playCancelled = false;
        if ($membership->provider === 'google_play' &&
            filled($membership->purchase_token) &&
            filled($membership->product_id)) {
            $playCancelled = $googlePlay->cancel(
                $domain,
                $membership->purchase_token,
                $membership->product_id,
                $domain->billing_settings['google_play']['package_name'] ?? null,
                $validated['reason'] ?? 'Cancelled by user from the app.'
            );
        }

        $membership->update([
            'is_active' => false,
            'status' => 'cancelled',
            'cancelled_at' => $membership->cancelled_at ?: now(),
            'cancellation_requested_at' => now(),
            'cancellation_reason' => $validated['reason'] ?? null,
            'cancellation_details' => $validated['details']
                ?? ($playCancelled ? 'Google Play subscription cancellation requested.' : null),
            'cancellation_source' => 'app',
        ]);

        app(EntitySmtpMailer::class)->membershipChanged($domain, $membership->fresh(), 'cancel requested from app');

        return response()->json([
            'success' => true,
            'message' => 'Membership cancellation request saved.',
            'membership' => [
                'application_id' => $domain->application_id,
                'email' => $membership->email,
                'plan' => $membership->plan,
                'billing_period' => $membership->billing_period,
                'is_active' => $membership->is_active,
                'provider' => $membership->provider,
                'status' => $membership->status,
                'order_id' => $membership->order_id,
                'product_id' => $membership->product_id,
                'base_plan_id' => $membership->base_plan_id,
                'offer_id' => $membership->offer_id,
                'cancelled_at' => $membership->cancelled_at?->toIso8601String(),
                'cancellation_requested_at' => $membership->cancellation_requested_at?->toIso8601String(),
                'cancellation_reason' => $membership->cancellation_reason,
                'cancellation_details' => $membership->cancellation_details,
                'cancellation_source' => $membership->cancellation_source,
            ],
        ]);
    }
}
