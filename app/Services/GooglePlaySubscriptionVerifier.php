<?php

namespace App\Services;

use App\Models\Domain;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class GooglePlaySubscriptionVerifier
{
    private const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    public function verify(Domain $domain, string $purchaseToken, ?string $packageName = null): array
    {
        $settings = $domain->billing_settings ?? [];
        $google = $settings['google_play'] ?? [];

        if (! ($settings['enabled'] ?? false) || ! ($google['enabled'] ?? false)) {
            throw ValidationException::withMessages([
                'billing' => 'Google Play billing is not enabled for this app.',
            ]);
        }

        $packageName = trim($packageName ?: ($google['package_name'] ?? '') ?: ($domain->application_id ?? ''));
        if ($packageName === '') {
            throw ValidationException::withMessages([
                'package_name' => 'Google Play package name is missing.',
            ]);
        }

        $serviceAccount = $this->serviceAccount($google['service_account_json'] ?? null);
        $accessToken = $this->accessToken($serviceAccount);

        $url = sprintf(
            'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/%s/purchases/subscriptionsv2/tokens/%s',
            rawurlencode($packageName),
            rawurlencode($purchaseToken),
        );

        $response = Http::withToken($accessToken)->acceptJson()->timeout(20)->get($url);

        if (! $response->successful()) {
            throw ValidationException::withMessages([
                'purchase_token' => $response->json('error.message') ?: 'Google Play could not verify this purchase token.',
            ]);
        }

        return $this->normalize($response->json() ?? [], (int) ($settings['grace_days'] ?? 3));
    }

    private function serviceAccount(mixed $raw): array
    {
        if (is_array($raw)) {
            $serviceAccount = $raw;
        } else {
            $serviceAccount = json_decode((string) $raw, true);
        }

        if (! is_array($serviceAccount) || empty($serviceAccount['client_email']) || empty($serviceAccount['private_key'])) {
            throw ValidationException::withMessages([
                'service_account_json' => 'A valid Google Play service account JSON file is required.',
            ]);
        }

        $serviceAccount['private_key'] = str_replace('\\n', "\n", $serviceAccount['private_key']);

        return $serviceAccount;
    }

    private function accessToken(array $serviceAccount): string
    {
        $cacheKey = 'google-play-access-token:'.sha1($serviceAccount['client_email']);

        return Cache::remember($cacheKey, now()->addMinutes(50), function () use ($serviceAccount) {
            $now = time();
            $jwtHeader = $this->base64UrlEncode(json_encode([
                'alg' => 'RS256',
                'typ' => 'JWT',
            ], JSON_THROW_ON_ERROR));
            $jwtClaim = $this->base64UrlEncode(json_encode([
                'iss' => $serviceAccount['client_email'],
                'scope' => self::SCOPE,
                'aud' => self::TOKEN_URL,
                'iat' => $now,
                'exp' => $now + 3600,
            ], JSON_THROW_ON_ERROR));

            $unsignedJwt = $jwtHeader.'.'.$jwtClaim;
            $signed = openssl_sign($unsignedJwt, $signature, $serviceAccount['private_key'], OPENSSL_ALGO_SHA256);

            if (! $signed) {
                throw ValidationException::withMessages([
                    'service_account_json' => 'Could not sign the Google Play service account JWT.',
                ]);
            }

            $jwt = $unsignedJwt.'.'.$this->base64UrlEncode($signature);

            $response = Http::asForm()->timeout(15)->post(self::TOKEN_URL, [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if (! $response->successful() || ! $response->json('access_token')) {
                throw ValidationException::withMessages([
                    'service_account_json' => $response->json('error_description') ?: 'Google OAuth did not return an access token.',
                ]);
            }

            return (string) $response->json('access_token');
        });
    }

    private function normalize(array $payload, int $graceDays): array
    {
        $lineItem = $payload['lineItems'][0] ?? [];
        $productId = $lineItem['productId'] ?? null;
        $expiry = $this->parseTime($lineItem['expiryTime'] ?? null);
        $state = (string) ($payload['subscriptionState'] ?? 'SUBSCRIPTION_STATE_UNSPECIFIED');
        $now = now();
        $graceExpiresAt = $expiry?->copy()->addDays(max(0, $graceDays));
        $hasPaidAccess = $expiry === null || $expiry->greaterThan($now);
        $hasGraceAccess = $graceExpiresAt !== null && $graceExpiresAt->greaterThan($now);
        $status = $this->statusFromState($state, $hasPaidAccess, $hasGraceAccess);

        return [
            'status' => $status,
            'is_active' => in_array($status, ['active', 'grace'], true),
            'subscription_state' => $state,
            'product_id' => $productId,
            'base_plan_id' => $lineItem['offerDetails']['basePlanId'] ?? null,
            'offer_id' => $lineItem['offerDetails']['offerId'] ?? null,
            'order_id' => $payload['latestOrderId'] ?? null,
            'country_code' => strtoupper((string) ($payload['regionCode'] ?? '')) ?: null,
            'expires_at' => $expiry,
            'grace_expires_at' => $graceExpiresAt,
            'raw' => $payload,
        ];
    }

    private function statusFromState(string $state, bool $hasPaidAccess, bool $hasGraceAccess): string
    {
        if ($hasPaidAccess && in_array($state, [
            'SUBSCRIPTION_STATE_ACTIVE',
            'SUBSCRIPTION_STATE_CANCELED',
            'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
        ], true)) {
            return 'active';
        }

        if ($hasGraceAccess || $state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD') {
            return 'grace';
        }

        if (in_array($state, [
            'SUBSCRIPTION_STATE_PENDING',
            'SUBSCRIPTION_STATE_PAUSED',
            'SUBSCRIPTION_STATE_ON_HOLD',
        ], true)) {
            return 'pending';
        }

        if ($state === 'SUBSCRIPTION_STATE_CANCELED') {
            return 'cancelled';
        }

        return 'expired';
    }

    private function parseTime(?string $value): ?CarbonImmutable
    {
        if (! $value) {
            return null;
        }

        return CarbonImmutable::parse($value);
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
