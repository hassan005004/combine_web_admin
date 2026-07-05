<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DomainController extends Controller
{
    public function index()
    {
        $domains = Domain::latest()->paginate(10);
        return view('domains.index', compact('domains'));
    }

    public function create()
    {
        return view('domains.form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'entry_type' => ['required', Rule::in(['app', 'website', 'both'])],
            'url' => 'nullable|url',
            'application_id' => ['required', 'string', 'max:255', 'unique:domains,application_id'],
            'cache_ttl_hours' => ['required', 'integer', 'min:1'],
            'seo_title' => 'nullable|string',
            'seo_description' => 'nullable|string',
            'seo_keywords' => 'nullable|string',
            'privacy_policy' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'support_policy' => 'nullable|string',
            'delete_policy' => 'nullable|string',
            'about_us' => 'nullable|string',
            'primary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $validated['ads_settings'] = $this->adsSettingsFromRequest($request);

        Domain::create($validated);

        return redirect()->route('domains.index')->with('success', 'Entry created successfully.');
    }

    public function edit(Domain $domain)
    {
        return view('domains.form', compact('domain'));
    }

    public function update(Request $request, Domain $domain)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'entry_type' => ['required', Rule::in(['app', 'website', 'both'])],
            'url' => 'nullable|url',
            'application_id' => ['required', 'string', 'max:255', Rule::unique('domains', 'application_id')->ignore($domain->id)],
            'cache_ttl_hours' => ['required', 'integer', 'min:1'],
            'seo_title' => 'nullable|string',
            'seo_description' => 'nullable|string',
            'seo_keywords' => 'nullable|string',
            'privacy_policy' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'support_policy' => 'nullable|string',
            'delete_policy' => 'nullable|string',
            'about_us' => 'nullable|string',
            'primary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $validated['ads_settings'] = $this->adsSettingsFromRequest($request);

        $domain->update($validated);

        return redirect()->route('domains.index')->with('success', 'Entry updated successfully.');
    }

    public function destroy(Domain $domain)
    {
        $domain->delete();
        return redirect()->route('domains.index')->with('success', 'Entry deleted successfully.');
    }

    private function adsSettingsFromRequest(Request $request): array
    {
        $types = ['bottom', 'app_open', 'full_screen', 'rewarded', 'native'];
        $settings = [];

        foreach ($types as $type) {
            $settings[$type] = [
                'enabled' => $request->boolean("ads.{$type}.enabled"),
                'unit_id' => $request->input("ads.{$type}.unit_id"),
                'frequency' => (int) $request->input("ads.{$type}.frequency", 0),
            ];
        }

        return $settings;
    }
}
