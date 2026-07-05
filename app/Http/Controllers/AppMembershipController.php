<?php

namespace App\Http\Controllers;

use App\Models\AppMembership;
use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppMembershipController extends Controller
{
    public function index(Request $request)
    {
        $selectedDomainId = $request->integer('domain_id') ?: null;
        $selectedDomain = $selectedDomainId ? Domain::find($selectedDomainId) : null;
        $memberships = AppMembership::with('domain')
            ->when($selectedDomainId, fn ($query) => $query->where('domain_id', $selectedDomainId))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return view('app-memberships.index', compact('memberships', 'selectedDomain', 'selectedDomainId'));
    }

    public function create(Request $request)
    {
        $domains = Domain::orderBy('title')->get();
        $selectedDomainId = $request->integer('domain_id') ?: null;

        return view('app-memberships.form', compact('domains', 'selectedDomainId'));
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $validated['email'] = strtolower($validated['email']);
        $validated['is_active'] = $request->boolean('is_active');

        AppMembership::create($validated);

        return redirect()->route('app-memberships.index', ['domain_id' => $validated['domain_id']])->with('success', 'Membership saved.');
    }

    public function edit(AppMembership $appMembership)
    {
        $domains = Domain::orderBy('title')->get();

        return view('app-memberships.form', compact('appMembership', 'domains'));
    }

    public function update(Request $request, AppMembership $appMembership)
    {
        $validated = $this->validated($request, $appMembership);
        $validated['email'] = strtolower($validated['email']);
        $validated['is_active'] = $request->boolean('is_active');

        $appMembership->update($validated);

        return redirect()->route('app-memberships.index', ['domain_id' => $validated['domain_id']])->with('success', 'Membership updated.');
    }

    public function destroy(AppMembership $appMembership)
    {
        $domainId = $appMembership->domain_id;
        $appMembership->delete();

        return redirect()->route('app-memberships.index', ['domain_id' => $domainId])->with('success', 'Membership deleted.');
    }

    private function validated(Request $request, ?AppMembership $membership = null): array
    {
        return $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'email' => [
                'required',
                'email',
                Rule::unique('app_memberships')->where(fn ($query) => $query->where('domain_id', $request->input('domain_id')))->ignore($membership?->id),
            ],
            'plan' => ['required', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
        ]);
    }
}
