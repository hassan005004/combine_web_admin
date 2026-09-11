<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Controllers\PublicAppPageController;
use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\Faq;
use App\Models\MembershipPlan;
use Illuminate\Http\Request;

class AppConfigController extends Controller
{
    public function show(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
            'country_code' => ['nullable', 'string', 'size:2'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $deviceId = $validated['device_id'] ?? null;
        $email = $validated['email'] ?? null;
        $countryCode = MembershipPlan::normalizeCountryCode($validated['country_code'] ?? null);
        $membership = null;

        $membershipQuery = AppMembership::where('domain_id', $domain->id)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now())
                    ->orWhere('grace_expires_at', '>', now());
            });

        if ($deviceId) {
            $membership = (clone $membershipQuery)
                ->where('device_id', $deviceId)
                ->first();
        }

        if (! $membership && $email) {
            $membership = (clone $membershipQuery)
                ->where('email', strtolower($email))
                ->first();
        }

        return response()->json([
            'success' => true,
            'server_time' => now()->toIso8601String(),
            'cache' => [
                'ttl_hours' => $domain->cache_ttl_hours,
                'next_fetch_after' => now()->addHours($domain->cache_ttl_hours)->toIso8601String(),
            ],
            'app' => [
                'application_id' => $domain->application_id,
                'title' => $domain->title,
                'entry_type' => $domain->entry_type,
                'resources' => array_values($domain->resources ?? []),
                'url' => $domain->url,
                'app_version' => $domain->app_version,
                'min_build_code' => $domain->min_build_code,
                'force_update' => (bool) $domain->force_update,
                'google_play_url' => $domain->google_play_url ?: ($domain->application_id ? 'https://play.google.com/store/apps/details?id='.$domain->application_id : null),
                'colors' => [
                    'primary' => $domain->primary_color,
                    'secondary' => $domain->secondary_color,
                ],
            ],
            'pages' => [
                'privacy_policy' => $domain->privacy_policy,
                'terms_conditions' => $domain->terms_conditions,
                'support_policy' => $domain->support_policy,
                'delete_policy' => $domain->delete_policy,
                'about_us' => $domain->about_us,
            ],
            'page_urls' => PublicAppPageController::pageUrls($domain),
            'social_links' => $domain->social_links ?? [],
            'faqs' => Faq::where('domain_id', $domain->id)
                ->orderBy('sorting')
                ->get(['id', 'question', 'answer', 'sorting'])
                ->map(fn ($faq) => [
                    'id' => $faq->id,
                    'question' => $faq->question,
                    'answer' => $faq->answer,
                    'sorting' => (int) ($faq->sorting ?? 0),
                ])
                ->values(),
            'ads' => $domain->ads_settings ?? [],
            'billing' => $this->billingPayload($domain),
            'auth' => [
                'login_provider' => 'google',
            ],
            'membership' => $this->membershipPayload($domain, $membership, (bool) $email, $countryCode),
        ]);
    }

    public function startTrial(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'device_id' => ['required', 'string', 'max:255'],
            'plan' => ['required', 'string', 'max:255'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $email = isset($validated['email']) ? strtolower($validated['email']) : null;
        $deviceId = trim($validated['device_id']);

        $plan = MembershipPlan::where('domain_id', $domain->id)
            ->where('name', $validated['plan'])
            ->where('is_active', true)
            ->firstOrFail();

        $trialDays = (int) ($plan->free_trial_days ?? 0);
        abort_if($trialDays <= 0, 422, 'Free trial is not available for this plan.');

        $activeMembership = AppMembership::where('domain_id', $domain->id)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now())
                    ->orWhere('grace_expires_at', '>', now());
            })
            ->where(function ($query) use ($deviceId, $email) {
                $query->where('device_id', $deviceId);

                if ($email) {
                    $query->orWhere('email', $email);
                }
            })
            ->exists();

        abort_if($activeMembership, 422, 'Membership is already active.');

        $usedTrial = AppMembership::where('domain_id', $domain->id)
            ->where(function ($query) use ($deviceId, $email) {
                $query->where('device_id', $deviceId);

                if ($email) {
                    $query->orWhere('email', $email);
                }
            })
            ->where(function ($query) {
                $query->whereNotNull('trial_started_at')
                    ->orWhere('cancellation_source', 'free_trial')
                    ->orWhere('provider', 'trial');
            })
            ->exists();

        abort_if($usedTrial, 422, 'Free trial has already been used.');

        $expiresAt = now()->addDays($trialDays);
        $graceDays = (int) (($domain->billing_settings['grace_days'] ?? 3));

        $membership = AppMembership::updateOrCreate(
            [
                'domain_id' => $domain->id,
                'device_id' => $deviceId,
            ],
            [
                'email' => $email,
                'device_id' => $deviceId,
                'plan' => $plan->name,
                'promo_code' => null,
                'promo_discount' => 0,
                'amount_paid' => 0,
                'provider' => 'trial',
                'status' => 'active',
                'is_active' => true,
                'expires_at' => $expiresAt,
                'grace_expires_at' => $expiresAt->copy()->addDays(max(0, $graceDays)),
                'trial_started_at' => now(),
                'last_verified_at' => now(),
                'cancelled_at' => null,
                'cancellation_requested_at' => null,
                'cancellation_reason' => null,
                'cancellation_details' => null,
                'cancellation_source' => 'free_trial',
            ]
        );

        return $this->show(new Request([
            'application_id' => $domain->application_id,
            'device_id' => $deviceId,
            'email' => $email,
        ]));
    }

    private function membershipPayload(Domain $domain, ?AppMembership $membership, bool $isLoggedIn, ?string $countryCode = null): array
    {
        $status = $membership ? $this->membershipStatus($membership) : 'free';
        $hasAccess = $membership && $membership->is_active && in_array($status, ['active', 'grace'], true);

        return [
            'is_logged_in' => $isLoggedIn,
            'is_active' => (bool) $hasAccess,
            'ads_removed' => (bool) $hasAccess,
            'in_grace' => $status === 'grace',
            'status' => $status,
            'plan' => $membership?->plan ?? 'free',
            'provider' => $membership?->provider,
            'product_id' => $membership?->product_id,
            'expires_at' => $membership?->expires_at?->toIso8601String(),
            'grace_expires_at' => $membership?->grace_expires_at?->toIso8601String(),
            'renew_before' => $membership?->grace_expires_at?->toIso8601String(),
            'plans' => $this->plansPayload($domain, $countryCode),
            'features' => $domain->membershipFeatures()
                ->where('is_active', true)
                ->orderBy('sorting')
                ->get(['icon', 'text', 'sorting'])
                ->map(fn ($feature) => [
                    'icon' => $feature->icon,
                    'text' => $feature->text,
                ])
                ->values(),
        ];
    }

    private function plansPayload(Domain $domain, ?string $countryCode = null)
    {
        return $domain->membershipPlans()
            ->with(['features' => fn ($query) => $query->where('is_active', true)->orderBy('sorting')])
            ->where('is_active', true)
            ->orderBy('sorting')
            ->get()
            ->map(function ($plan) use ($countryCode) {
                $yearlyFreeMonths = (int) ($plan->yearly_free_months ?? 0);
                $pricing = $plan->resolvedPricing($countryCode);

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'monthly_price' => $pricing['monthly_price'],
                    'yearly_price' => $pricing['yearly_price'],
                    'currency' => $pricing['currency'],
                    'default_monthly_price' => $pricing['default_monthly_price'],
                    'default_yearly_price' => $pricing['default_yearly_price'],
                    'default_currency' => $pricing['default_currency'],
                    'selected_country_code' => $pricing['country_code'],
                    'country_price_applied' => $pricing['country_price_applied'],
                    'free_trial_days' => (int) ($plan->free_trial_days ?? 0),
                    'yearly_free_months' => $yearlyFreeMonths,
                    'tagline' => $plan->tagline,
                    'yearly_benefit' => $plan->yearly_benefit,
                    'google_play' => [
                        'monthly_product_id' => $plan->google_play_monthly_product_id,
                        'monthly_base_plan_id' => $plan->google_play_monthly_base_plan_id,
                        'monthly_offer_id' => $plan->google_play_monthly_offer_id,
                        'yearly_product_id' => $plan->google_play_yearly_product_id,
                        'yearly_base_plan_id' => $plan->google_play_yearly_base_plan_id,
                        'yearly_offer_id' => $plan->google_play_yearly_offer_id,
                    ],
                    'country_prices' => $plan->country_prices ?? [],
                    'features' => $plan->features
                        ->map(fn ($feature) => [
                            'icon' => $feature->icon,
                            'text' => $feature->text,
                        ])
                        ->values(),
                ];
            })
            ->values();
    }

    private function billingPayload(Domain $domain): array
    {
        $settings = $domain->billing_settings ?? [];
        $google = $settings['google_play'] ?? [];

        return [
            'enabled' => (bool) ($settings['enabled'] ?? false),
            'grace_days' => (int) ($settings['grace_days'] ?? 3),
            'google_play' => [
                'enabled' => (bool) ($google['enabled'] ?? false),
                'package_name' => $google['package_name'] ?? $domain->application_id,
            ],
        ];
    }

    private function membershipStatus(AppMembership $membership): string
    {
        $now = now();
        $paidActive = $membership->expires_at === null || $membership->expires_at->greaterThan($now);

        if ($paidActive) {
            return $membership->status ?: 'active';
        }

        if ($membership->grace_expires_at !== null && $membership->grace_expires_at->greaterThan($now)) {
            return 'grace';
        }

        return 'expired';
    }
}
