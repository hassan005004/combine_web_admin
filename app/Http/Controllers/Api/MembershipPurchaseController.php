<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\MembershipPlan;
use App\Services\GooglePlaySubscriptionVerifier;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class MembershipPurchaseController extends Controller
{
    public function verify(Request $request, GooglePlaySubscriptionVerifier $verifier)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'device_id' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'package_name' => ['nullable', 'string', 'max:255'],
            'product_id' => ['nullable', 'string', 'max:255'],
            'base_plan_id' => ['nullable', 'string', 'max:255'],
            'offer_id' => ['nullable', 'string', 'max:255'],
            'purchase_token' => ['required', 'string'],
            'country_code' => ['nullable', 'string', 'size:2'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $verified = $verifier->verify(
            $domain,
            $validated['purchase_token'],
            $validated['package_name'] ?? null,
        );

        $productId = $verified['product_id'] ?: ($validated['product_id'] ?? null);
        $plan = $this->planForProduct($domain, $productId);

        if (! $plan) {
            throw ValidationException::withMessages([
                'product_id' => 'No active membership plan is mapped to this Google Play product id.',
            ]);
        }

        $verifiedBasePlanId = $verified['base_plan_id'] ?: ($validated['base_plan_id'] ?? null);
        $period = $this->periodForProduct($plan, $productId, $verifiedBasePlanId);
        $countryCode = strtoupper($verified['country_code'] ?: ($validated['country_code'] ?? '')) ?: null;
        [$amountPaid, $currency] = $this->priceForPlan($plan, $period, $countryCode);
        $wasAcknowledged = $this->isAcknowledged($verified);
        if ((bool) $verified['is_active'] && ! $wasAcknowledged) {
            $wasAcknowledged = $verifier->acknowledge(
                $domain,
                $validated['purchase_token'],
                $productId,
                $validated['package_name'] ?? null,
            ) || $wasAcknowledged;
        }
        $purchaseToken = $validated['purchase_token'];
        $purchaseTokenHash = hash('sha256', $purchaseToken);
        $membership = $this->membershipRecord(
            $domain,
            $purchaseTokenHash,
            trim($validated['device_id']),
            isset($validated['email']) ? strtolower($validated['email']) : null,
        );
        $this->releaseMembershipIdentifiers(
            $domain,
            $membership,
            $purchaseTokenHash,
            trim($validated['device_id']),
            isset($validated['email']) ? strtolower($validated['email']) : null,
        );

        $membershipData = [
            'domain_id' => $domain->id,
            'email' => isset($validated['email']) ? strtolower($validated['email']) : $membership->email,
            'device_id' => trim($validated['device_id']),
            'plan' => $plan->name,
            'billing_period' => $period,
            'promo_code' => null,
            'promo_discount' => 0,
            'amount_paid' => $amountPaid,
            'provider' => 'google_play',
            'status' => $verified['status'],
            'purchase_token_hash' => $purchaseTokenHash,
            'purchase_token' => $purchaseToken,
            'order_id' => $verified['order_id'],
            'product_id' => $productId,
            'base_plan_id' => $verifiedBasePlanId,
            'offer_id' => $verified['offer_id'] ?: ($validated['offer_id'] ?? null),
            'country_code' => $countryCode,
            'currency' => $currency,
            'is_active' => (bool) $verified['is_active'],
            'expires_at' => $verified['expires_at'],
            'grace_expires_at' => $verified['grace_expires_at'],
            'last_verified_at' => now(),
            'raw_purchase' => $verified['raw'],
            'cancelled_at' => $verified['status'] === 'cancelled' ? now() : null,
        ];
        $membershipData['raw_purchase']['controlhub_acknowledged'] = $wasAcknowledged;

        if ($verified['status'] === 'cancelled') {
            $membershipData['cancellation_source'] = 'google_play';
        } elseif (in_array($verified['status'], ['active', 'grace'], true)) {
            $membershipData['cancellation_requested_at'] = null;
            $membershipData['cancellation_reason'] = null;
            $membershipData['cancellation_details'] = null;
            $membershipData['cancellation_source'] = 'google_play';
        }

        $membership->fill($membershipData);
        $membership->save();

        return response()->json([
            'success' => true,
            'membership' => $this->membershipPayload($membership->fresh()),
            'verified' => [
                'subscription_state' => $verified['subscription_state'],
                'acknowledgement_state' => $verified['acknowledgement_state'] ?? null,
                'acknowledged' => $wasAcknowledged,
                'product_id' => $productId,
                'period' => $period,
            ],
        ]);
    }

    private function membershipRecord(Domain $domain, string $purchaseTokenHash, string $deviceId, ?string $email): AppMembership
    {
        $query = AppMembership::where('domain_id', $domain->id);

        $membership = (clone $query)->where('purchase_token_hash', $purchaseTokenHash)->first();

        if (! $membership && $deviceId !== '') {
            $membership = (clone $query)->where('device_id', $deviceId)->first();
        }

        if (! $membership && $email) {
            $membership = (clone $query)->where('email', $email)->first();
        }

        return $membership ?: new AppMembership();
    }

    private function releaseMembershipIdentifiers(
        Domain $domain,
        AppMembership $target,
        string $purchaseTokenHash,
        string $deviceId,
        ?string $email
    ): void {
        $query = AppMembership::where('domain_id', $domain->id);

        if ($target->exists) {
            $query->where('id', '!=', $target->getKey());
        }

        $conflicts = $query
            ->where(function ($query) use ($purchaseTokenHash, $deviceId, $email) {
                $query->where('purchase_token_hash', $purchaseTokenHash);

                if ($deviceId !== '') {
                    $query->orWhere('device_id', $deviceId);
                }

                if ($email) {
                    $query->orWhere('email', $email);
                }
            })
            ->get();

        foreach ($conflicts as $conflict) {
            if ($deviceId !== '' && $conflict->device_id === $deviceId) {
                $conflict->device_id = null;
            }

            if ($email && $conflict->email === $email) {
                $conflict->email = null;
            }

            if ($conflict->purchase_token_hash === $purchaseTokenHash) {
                $conflict->purchase_token_hash = null;
                $conflict->purchase_token = null;
            }

            $conflict->save();
        }
    }

    private function planForProduct(Domain $domain, ?string $productId): ?MembershipPlan
    {
        if (! $productId) {
            return null;
        }

        return MembershipPlan::where('domain_id', $domain->id)
            ->where('is_active', true)
            ->get()
            ->first(fn (MembershipPlan $plan) => $plan->hasGooglePlayProductId($productId));
    }

    private function periodForProduct(MembershipPlan $plan, ?string $productId, ?string $basePlanId): string
    {
        return $plan->periodForGooglePlayProductId($productId, $basePlanId);
    }

    private function priceForPlan(MembershipPlan $plan, string $period, ?string $countryCode): array
    {
        $pricing = $plan->resolvedPricing($countryCode);
        $priceKey = $period === 'yearly' ? 'yearly_price' : 'monthly_price';

        return [(float) $pricing[$priceKey], strtoupper((string) $pricing['currency'])];
    }

    private function membershipPayload(AppMembership $membership): array
    {
        $now = now();
        $isPaidActive = $membership->expires_at === null || $membership->expires_at->greaterThan($now);
        $isInGrace = ! $isPaidActive
            && $membership->grace_expires_at !== null
            && $membership->grace_expires_at->greaterThan($now);

        return [
            'is_active' => (bool) $membership->is_active && ($isPaidActive || $isInGrace),
            'ads_removed' => (bool) $membership->is_active && ($isPaidActive || $isInGrace),
            'in_grace' => $isInGrace,
            'status' => $isInGrace ? 'grace' : $membership->status,
            'provider' => $membership->provider,
            'plan' => $membership->plan,
            'billing_period' => $membership->billing_period,
            'product_id' => $membership->product_id,
            'country_code' => $membership->country_code,
            'currency' => $membership->currency,
            'amount_paid' => $membership->amount_paid !== null ? (float) $membership->amount_paid : null,
            'expires_at' => $membership->expires_at?->toIso8601String(),
            'grace_expires_at' => $membership->grace_expires_at?->toIso8601String(),
            'last_verified_at' => $membership->last_verified_at?->toIso8601String(),
        ];
    }

    private function isAcknowledged(array $verified): bool
    {
        $state = strtoupper((string) ($verified['acknowledgement_state'] ?? ''));

        return $state === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED';
    }
}
