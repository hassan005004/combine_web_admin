<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\MembershipFeature;
use Illuminate\Http\Request;

class MembershipFeatureController extends Controller
{
    public function index(Request $request)
    {
        $selectedDomainId = $request->integer('domain_id') ?: null;
        $selectedDomain = $selectedDomainId ? Domain::find($selectedDomainId) : null;
        $features = MembershipFeature::with('domain')
            ->when($selectedDomainId, fn ($query) => $query->where('domain_id', $selectedDomainId))
            ->orderBy('domain_id')
            ->orderBy('sorting')
            ->paginate(30)
            ->withQueryString();

        return view('membership-features.index', compact('features', 'selectedDomain', 'selectedDomainId'));
    }

    public function create(Request $request)
    {
        $domains = Domain::orderBy('title')->get();
        $selectedDomainId = $request->integer('domain_id') ?: null;

        return view('membership-features.form', compact('domains', 'selectedDomainId'));
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $validated['is_active'] = $request->boolean('is_active');

        MembershipFeature::create($validated);

        return redirect()->route('membership-features.index', ['domain_id' => $validated['domain_id']])->with('success', 'Feature saved.');
    }

    public function edit(MembershipFeature $membershipFeature)
    {
        $domains = Domain::orderBy('title')->get();

        return view('membership-features.form', compact('membershipFeature', 'domains'));
    }

    public function update(Request $request, MembershipFeature $membershipFeature)
    {
        $validated = $this->validated($request);
        $validated['is_active'] = $request->boolean('is_active');

        $membershipFeature->update($validated);

        return redirect()->route('membership-features.index', ['domain_id' => $validated['domain_id']])->with('success', 'Feature updated.');
    }

    public function destroy(MembershipFeature $membershipFeature)
    {
        $domainId = $membershipFeature->domain_id;
        $membershipFeature->delete();

        return redirect()->route('membership-features.index', ['domain_id' => $domainId])->with('success', 'Feature deleted.');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'icon' => ['nullable', 'string', 'max:255'],
            'text' => ['nullable', 'string', 'max:255'],
            'sorting' => ['nullable', 'integer', 'min:0'],
        ]);
    }
}
