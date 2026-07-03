<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\MembershipPlan;
use Illuminate\Http\Request;

class MembershipPlanController extends Controller
{
    public function index(Request $request)
    {
        $selectedDomainId = $request->integer('domain_id') ?: null;
        $selectedDomain = $selectedDomainId ? Domain::find($selectedDomainId) : null;
        $plans = MembershipPlan::with('domain')
            ->when($selectedDomainId, fn ($query) => $query->where('domain_id', $selectedDomainId))
            ->orderBy('domain_id')
            ->orderBy('sorting')
            ->paginate(30)
            ->withQueryString();

        return view('membership-plans.index', compact('plans', 'selectedDomain', 'selectedDomainId'));
    }

    public function create(Request $request)
    {
        $domains = Domain::orderBy('title')->get();
        $selectedDomainId = $request->integer('domain_id') ?: null;

        return view('membership-plans.form', compact('domains', 'selectedDomainId'));
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $validated['is_active'] = $request->boolean('is_active');

        MembershipPlan::create($validated);

        return redirect()->route('membership-plans.index', ['domain_id' => $validated['domain_id']])->with('success', 'Plan saved.');
    }

    public function edit(MembershipPlan $membershipPlan)
    {
        $domains = Domain::orderBy('title')->get();

        return view('membership-plans.form', compact('membershipPlan', 'domains'));
    }

    public function update(Request $request, MembershipPlan $membershipPlan)
    {
        $validated = $this->validated($request);
        $validated['is_active'] = $request->boolean('is_active');

        $membershipPlan->update($validated);

        return redirect()->route('membership-plans.index', ['domain_id' => $validated['domain_id']])->with('success', 'Plan updated.');
    }

    public function destroy(MembershipPlan $membershipPlan)
    {
        $domainId = $membershipPlan->domain_id;
        $membershipPlan->delete();

        return redirect()->route('membership-plans.index', ['domain_id' => $domainId])->with('success', 'Plan deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'name' => ['required', 'string', 'max:255'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['required', 'numeric', 'min:0'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'yearly_benefit' => ['nullable', 'string', 'max:255'],
            'sorting' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
