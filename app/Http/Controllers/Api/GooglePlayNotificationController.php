<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\MembershipPlan;
use App\Services\GooglePlaySubscriptionVerifier;
use Illuminate\Http\Request;

class GooglePlayNotificationController extends Controller
{
    public function store(Request $request, GooglePlaySubscriptionVerifier $verifier)
    {
        $notification = $this->notificationPayload($request);
        $subscription = $notification['subscriptionNotification'] ?? null;

        if (! is_array($subscription)) {
            return response()->json([
                'success' => true,
                'ignored' => true,
                'message' => 'No subscription notification was included.',
            ]);
        }

        $packageName = trim((string) ($notification['packageName'] ?? ''));
        $purchaseToken = trim((string) ($subscription['purchaseToken'] ?? ''));
        $subscriptionId = trim((string) ($subscription['subscriptionId'] ?? ''));

        if ($purchaseToken === '') {
            return response()->json([
                'success' => false,
                'message' => 'Google Play notification did not include a purchase token.',
            ], 422);
        }

        $domain = $this->domainForPackage($packageName);

        if (! $domain) {
            return response()->json([
                'success' => true,
                'ignored' => true,
                'message' => 'No ControlHub app matched this Google Play package.',
                'package_name' => $packageName,
            ], 202);
        }

        $verified = $verifier->verify($domain, $purchaseToken, $packageName);
        $productId = $verified['product_id'] ?: $subscriptionId;
        $plan = $this->planForProduct($domain, $productId);

        if (! $plan) {
            return response()->json([
                'success' => true,
                'ignored' => true,
                'message' => 'No active membership plan is mapped to this Google Play product id.',
                'product_id' => $productId,
            ], 202);
        }

        $wasAcknowledged = $this->isAcknowledged($verified);
        if ((bool) $verified['is_active'] && ! $wasAcknowledged) {
            $wasAcknowledged = $verifier->acknowledge(
                $domain,
                $purchaseToken,
                $productId,
                $packageName,
            ) || $wasAcknowledged;
        }

        $period = $plan->periodForGooglePlayProductId($productId, $verified['base_plan_id'] ?? null);
        $countryCode = strtoupper((string) ($verified['country_code'] ?? '')) ?: null;
        [$amountPaid, $currency] = $this->priceForPlan($plan, $period, $countryCode);
        $purchaseTokenHash = hash('sha256', $purchaseToken);
        $membership = AppMembership::where('domain_id', $domain->id)
            ->where('purchase_token_hash', $purchaseTokenHash)
            ->first() ?: new AppMembership();
        $rawPurchase = $verified['raw'] ?? [];
        $rawPurchase['controlhub_acknowledged'] = $wasAcknowledged;
        $rawPurchase['controlhub_notification'] = $notification;

        $membership->fill([
            'domain_id' => $domain->id,
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
            'base_plan_id' => $verified['base_plan_id'] ?? null,
            'offer_id' => $verified['offer_id'] ?? null,
            'country_code' => $countryCode,
            'currency' => $currency,
            'is_active' => (bool) $verified['is_active'],
            'expires_at' => $verified['expires_at'],
            'grace_expires_at' => $verified['grace_expires_at'],
            'last_verified_at' => now(),
            'raw_purchase' => $rawPurchase,
            'cancelled_at' => $verified['status'] === 'cancelled' ? now() : null,
            'cancellation_source' => in_array($verified['status'], ['active', 'grace'], true)
                ? 'google_play'
                : ($verified['status'] === 'cancelled' ? 'google_play' : $membership->cancellation_source),
        ]);

        if (in_array($verified['status'], ['active', 'grace'], true)) {
            $membership->cancellation_requested_at = null;
            $membership->cancellation_reason = null;
            $membership->cancellation_details = null;
        }

        $membership->save();

        return response()->json([
            'success' => true,
            'membership_id' => $membership->id,
            'product_id' => $productId,
            'period' => $period,
            'status' => $verified['status'],
            'acknowledged' => $wasAcknowledged,
        ]);
    }

    private function notificationPayload(Request $request): array
    {
        $payload = $request->json()->all();
        $data = $payload['message']['data'] ?? null;

        if (is_string($data) && $data !== '') {
            $decoded = json_decode(base64_decode($data, true) ?: '', true);

            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return is_array($payload) ? $payload : [];
    }

    private function domainForPackage(string $packageName): ?Domain
    {
        if ($packageName === '') {
            return null;
        }

        return Domain::query()
            ->where('application_id', $packageName)
            ->get()
            ->merge(Domain::all())
            ->first(function (Domain $domain) use ($packageName) {
                $settings = $domain->billing_settings ?? [];
                $google = $settings['google_play'] ?? [];

                return $domain->application_id === $packageName
                    || trim((string) ($google['package_name'] ?? '')) === $packageName;
            });
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

    private function priceForPlan(MembershipPlan $plan, string $period, ?string $countryCode): array
    {
        $pricing = $plan->resolvedPricing($countryCode);
        $priceKey = $period === 'yearly' ? 'yearly_price' : 'monthly_price';

        return [(float) $pricing[$priceKey], strtoupper((string) $pricing['currency'])];
    }

    private function isAcknowledged(array $verified): bool
    {
        $state = strtoupper((string) ($verified['acknowledgement_state'] ?? ''));

        return $state === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED';
    }
}
