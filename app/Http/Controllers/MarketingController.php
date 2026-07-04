<?php

namespace App\Http\Controllers;

use App\Models\Affiliate;
use App\Models\AffiliateConversion;
use App\Models\Campaign;
use App\Models\Domain;
use App\Models\LandingPage;
use App\Models\MarketingExpense;
use App\Models\ReferralProgram;
use App\Models\ReferralUse;
use App\Models\RevenueEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MarketingController extends Controller
{
    // ══════════════════════════════════════════════════════════════════════════
    // OVERVIEW — all marketing data for an entry
    // ══════════════════════════════════════════════════════════════════════════

    public function overview(Domain $domain)
    {
        $revenue = RevenueEntry::where('domain_id', $domain->id)->orderBy('date')->get();
        $campaigns = Campaign::where('domain_id', $domain->id)->latest()->get();
        $expenses = MarketingExpense::with('campaign:id,name')->where('domain_id', $domain->id)->orderByDesc('date')->get();
        $manualRevenue = (float) $revenue->sum('amount');
        $campaignRevenue = (float) $campaigns->sum('earned_amount');
        $campaignSpend = (float) $campaigns->sum('spent_amount');
        $otherExpenses = (float) $expenses->sum('amount');
        $totalRevenue = $manualRevenue + $campaignRevenue;
        $totalExpenses = $campaignSpend + $otherExpenses;

        return response()->json([
            'campaigns'        => $campaigns,
            'referral_programs'=> ReferralProgram::withCount('uses')->where('domain_id', $domain->id)->latest()->get(),
            'affiliates'       => Affiliate::withCount('conversions')->where('domain_id', $domain->id)->latest()->get(),
            'landing_pages'    => LandingPage::where('domain_id', $domain->id)->latest()->get(),
            'revenue'          => $revenue,
            'expenses'         => $expenses,
            'finance_summary'  => [
                'manual_revenue' => $manualRevenue,
                'campaign_revenue' => $campaignRevenue,
                'total_revenue' => $totalRevenue,
                'campaign_spend' => $campaignSpend,
                'other_expenses' => $otherExpenses,
                'total_expenses' => $totalExpenses,
                'net_earning' => $totalRevenue - $totalExpenses,
            ],
            'revenue_summary'  => [
                'total'    => $revenue->sum('amount'),
                'by_source'=> $revenue->groupBy('source')->map(fn ($g) => $g->sum('amount')),
                'by_month' => $revenue->groupBy(fn ($r) => $r->date->format('Y-m'))
                                      ->map(fn ($g) => $g->sum('amount')),
            ],
        ]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // CAMPAIGNS
    // ══════════════════════════════════════════════════════════════════════════

    public function storeCampaign(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'type'         => ['required', 'in:email,sms,push,facebook,google,tiktok,instagram,other'],
            'platform'     => ['nullable', 'string', 'max:100'],
            'objective'    => ['nullable', 'string', 'max:255'],
            'budget_amount'=> ['nullable', 'numeric', 'min:0'],
            'spent_amount' => ['nullable', 'numeric', 'min:0'],
            'earned_amount'=> ['nullable', 'numeric', 'min:0'],
            'subject'      => ['nullable', 'string', 'max:255'],
            'body'         => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $data['domain_id'] = $domain->id;
        $data['status'] = isset($data['scheduled_at']) ? 'scheduled' : 'draft';

        return response()->json(['campaign' => Campaign::create($data)], 201);
    }

    public function updateCampaign(Request $request, Domain $domain, Campaign $campaign)
    {
        $data = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'type'         => ['required', 'in:email,sms,push,facebook,google,tiktok,instagram,other'],
            'platform'     => ['nullable', 'string', 'max:100'],
            'objective'    => ['nullable', 'string', 'max:255'],
            'budget_amount'=> ['nullable', 'numeric', 'min:0'],
            'spent_amount' => ['nullable', 'numeric', 'min:0'],
            'earned_amount'=> ['nullable', 'numeric', 'min:0'],
            'status'       => ['nullable', 'in:draft,scheduled,sent,cancelled'],
            'subject'      => ['nullable', 'string', 'max:255'],
            'body'         => ['nullable', 'string'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        $campaign->update($data);

        return response()->json(['campaign' => $campaign->fresh()]);
    }

    public function destroyCampaign(Domain $domain, Campaign $campaign)
    {
        $campaign->delete();

        return response()->json(['success' => true]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // REFERRAL PROGRAMS
    // ══════════════════════════════════════════════════════════════════════════

    public function storeReferral(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'code'         => ['nullable', 'string', 'max:50', 'unique:referral_programs,code'],
            'description'  => ['nullable', 'string'],
            'reward_type'  => ['required', 'in:discount,credit,free_days'],
            'reward_value' => ['required', 'numeric', 'min:0'],
            'is_active'    => ['boolean'],
        ]);

        $data['domain_id'] = $domain->id;
        $data['code']      = $data['code'] ?? strtoupper(Str::random(8));

        return response()->json(['program' => ReferralProgram::create($data)], 201);
    }

    public function updateReferral(Request $request, Domain $domain, ReferralProgram $program)
    {
        $data = $request->validate([
            'name'         => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string'],
            'reward_type'  => ['required', 'in:discount,credit,free_days'],
            'reward_value' => ['required', 'numeric', 'min:0'],
            'is_active'    => ['boolean'],
        ]);

        $program->update($data);

        return response()->json(['program' => $program->fresh()]);
    }

    public function destroyReferral(Domain $domain, ReferralProgram $program)
    {
        $program->delete();

        return response()->json(['success' => true]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AFFILIATES
    // ══════════════════════════════════════════════════════════════════════════

    public function storeAffiliate(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'email'           => ['required', 'email'],
            'code'            => ['nullable', 'string', 'max:50', 'unique:affiliates,code'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $data['domain_id'] = $domain->id;
        $data['code']      = $data['code'] ?? strtoupper(Str::random(8));

        return response()->json(['affiliate' => Affiliate::create($data)], 201);
    }

    public function updateAffiliate(Request $request, Domain $domain, Affiliate $affiliate)
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'email'           => ['required', 'email'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'status'          => ['required', 'in:active,inactive,suspended'],
        ]);

        $affiliate->update($data);

        return response()->json(['affiliate' => $affiliate->fresh()]);
    }

    public function destroyAffiliate(Domain $domain, Affiliate $affiliate)
    {
        $affiliate->delete();

        return response()->json(['success' => true]);
    }

    public function storeConversion(Request $request, Domain $domain, Affiliate $affiliate)
    {
        $data = $request->validate([
            'customer_email'    => ['nullable', 'email'],
            'order_amount'      => ['required', 'numeric', 'min:0'],
            'commission_amount' => ['nullable', 'numeric', 'min:0'],
            'status'            => ['nullable', 'in:pending,approved,paid,rejected'],
        ]);

        $data['affiliate_id'] = $affiliate->id;
        if (! isset($data['commission_amount'])) {
            $data['commission_amount'] = round($data['order_amount'] * $affiliate->commission_rate / 100, 2);
        }

        $conversion = AffiliateConversion::create($data);

        // Update total_earned
        $affiliate->increment('total_earned', $data['commission_amount']);

        return response()->json(['conversion' => $conversion], 201);
    }

    public function updateConversion(Request $request, Domain $domain, Affiliate $affiliate, AffiliateConversion $conversion)
    {
        $old = $conversion->status;
        $data = $request->validate([
            'status' => ['required', 'in:pending,approved,paid,rejected'],
        ]);

        $conversion->update($data);

        // If marked paid, track in total_paid
        if ($data['status'] === 'paid' && $old !== 'paid') {
            $affiliate->increment('total_paid', $conversion->commission_amount);
        }

        return response()->json(['conversion' => $conversion->fresh()]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // LANDING PAGES
    // ══════════════════════════════════════════════════════════════════════════

    public function storeLandingPage(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255', 'unique:landing_pages,slug'],
            'headline'    => ['nullable', 'string'],
            'subheadline' => ['nullable', 'string'],
            'content'     => ['nullable', 'string'],
            'cta_text'    => ['nullable', 'string', 'max:255'],
            'cta_url'     => ['nullable', 'url'],
            'hero_image'  => ['nullable', 'string'],
            'status'      => ['nullable', 'in:draft,published'],
        ]);

        $data['domain_id'] = $domain->id;
        $data['slug']      = $data['slug'] ?? Str::slug($data['title']) . '-' . Str::random(4);

        return response()->json(['page' => LandingPage::create($data)], 201);
    }

    public function updateLandingPage(Request $request, Domain $domain, LandingPage $landingPage)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'headline'    => ['nullable', 'string'],
            'subheadline' => ['nullable', 'string'],
            'content'     => ['nullable', 'string'],
            'cta_text'    => ['nullable', 'string', 'max:255'],
            'cta_url'     => ['nullable', 'url'],
            'hero_image'  => ['nullable', 'string'],
            'status'      => ['nullable', 'in:draft,published'],
        ]);

        $landingPage->update($data);

        return response()->json(['page' => $landingPage->fresh()]);
    }

    public function destroyLandingPage(Domain $domain, LandingPage $landingPage)
    {
        $landingPage->delete();

        return response()->json(['success' => true]);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // REVENUE
    // ══════════════════════════════════════════════════════════════════════════

    public function storeRevenue(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'source'      => ['required', 'string', 'max:100'],
            'amount'      => ['required', 'numeric', 'min:0'],
            'currency'    => ['nullable', 'string', 'max:3'],
            'description' => ['nullable', 'string', 'max:500'],
            'date'        => ['required', 'date'],
        ]);

        $data['currency'] = strtoupper($data['currency'] ?: 'PKR');
        $data['domain_id'] = $domain->id;

        return response()->json(['entry' => RevenueEntry::create($data)], 201);
    }

    public function updateRevenue(Request $request, Domain $domain, RevenueEntry $revenueEntry)
    {
        $data = $request->validate([
            'source'      => ['required', 'string', 'max:100'],
            'amount'      => ['required', 'numeric', 'min:0'],
            'currency'    => ['nullable', 'string', 'max:3'],
            'description' => ['nullable', 'string', 'max:500'],
            'date'        => ['required', 'date'],
        ]);

        $data['currency'] = strtoupper($data['currency'] ?: 'PKR');
        $revenueEntry->update($data);

        return response()->json(['entry' => $revenueEntry->fresh()]);
    }

    public function destroyRevenue(Domain $domain, RevenueEntry $revenueEntry)
    {
        $revenueEntry->delete();

        return response()->json(['success' => true]);
    }

    public function storeExpense(Request $request, Domain $domain)
    {
        $data = $this->validateExpense($request);
        $data['domain_id'] = $domain->id;

        return response()->json(['expense' => MarketingExpense::create($data)], 201);
    }

    public function updateExpense(Request $request, Domain $domain, MarketingExpense $expense)
    {
        $expense->update($this->validateExpense($request));

        return response()->json(['expense' => $expense->fresh('campaign:id,name')]);
    }

    public function destroyExpense(Domain $domain, MarketingExpense $expense)
    {
        $expense->delete();

        return response()->json(['success' => true]);
    }

    private function validateExpense(Request $request): array
    {
        $data = $request->validate([
            'campaign_id' => ['nullable', 'exists:campaigns,id'],
            'category' => ['required', 'string', 'max:100'],
            'amount' => ['required', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'max:3'],
            'description' => ['nullable', 'string', 'max:500'],
            'date' => ['required', 'date'],
        ]);

        $data['currency'] = strtoupper($data['currency'] ?: 'PKR');

        return $data;
    }
}
