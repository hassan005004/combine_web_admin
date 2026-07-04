<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\MembershipPlan;
use Illuminate\Http\Request;

class AppConfigController extends Controller
{
    public function show(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'email' => ['nullable', 'email'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $email = $validated['email'] ?? null;
        $membership = null;

        if ($email) {
            $membership = AppMembership::where('domain_id', $domain->id)
                ->where('email', strtolower($email))
                ->where('is_active', true)
                ->where(function ($query) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
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
                'url' => $domain->url,
                'colors' => [
                    'primary' => $domain->primary_color,
                    'secondary' => $domain->secondary_color,
                ],
            ],
            'pages' => [
                'privacy_policy' => $domain->privacy_policy,
                'terms_conditions' => $domain->terms_conditions,
                'support_policy' => $domain->support_policy,
                'about_us' => $domain->about_us,
            ],
            'ads' => $domain->ads_settings ?? [],
            'auth' => [
                'login_provider' => 'google',
            ],
            'membership' => [
                'is_logged_in' => (bool) $email,
                'is_active' => (bool) $membership,
                'plan' => $membership?->plan ?? 'free',
                'expires_at' => $membership?->expires_at?->toIso8601String(),
                'plans' => $domain->membershipPlans()
                    ->with(['features' => fn ($query) => $query->where('is_active', true)->orderBy('sorting')])
                    ->where('is_active', true)
                    ->orderBy('sorting')
                    ->get(['id', 'domain_id', 'name', 'monthly_price', 'yearly_price', 'free_trial_days', 'tagline', 'yearly_benefit', 'sorting'])
                    ->map(fn ($plan) => [
                        'name' => $plan->name,
                        'monthly_price' => (float) $plan->monthly_price,
                        'yearly_price' => (float) $plan->yearly_price,
                        'free_trial_days' => (int) ($plan->free_trial_days ?? 0),
                        'tagline' => $plan->tagline,
                        'yearly_benefit' => $plan->yearly_benefit,
                        'features' => $plan->features
                            ->map(fn ($feature) => [
                                'icon' => $feature->icon,
                                'text' => $feature->text,
                            ])
                            ->values(),
                    ])
                    ->values(),
                'features' => $domain->membershipFeatures()
                    ->where('is_active', true)
                    ->orderBy('sorting')
                    ->get(['icon', 'text', 'sorting'])
                    ->map(fn ($feature) => [
                        'icon' => $feature->icon,
                        'text' => $feature->text,
                    ])
                    ->values(),
            ],
        ]);
    }

    public function startTrial(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'email' => ['required', 'email'],
            'plan' => ['required', 'string', 'max:255'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $email = strtolower($validated['email']);

        $plan = MembershipPlan::where('domain_id', $domain->id)
            ->where('name', $validated['plan'])
            ->where('is_active', true)
            ->firstOrFail();

        $trialDays = (int) ($plan->free_trial_days ?? 0);
        abort_if($trialDays <= 0, 422, 'Free trial is not available for this plan.');

        $membership = AppMembership::updateOrCreate(
            [
                'domain_id' => $domain->id,
                'email' => $email,
            ],
            [
                'plan' => $plan->name,
                'promo_code' => null,
                'promo_discount' => 0,
                'amount_paid' => 0,
                'is_active' => true,
                'expires_at' => now()->addDays($trialDays),
                'cancelled_at' => null,
                'cancellation_requested_at' => null,
                'cancellation_reason' => null,
                'cancellation_details' => null,
                'cancellation_source' => 'free_trial',
            ]
        );

        return $this->show(new Request([
            'application_id' => $domain->application_id,
            'email' => $email,
        ]));
    }
}
