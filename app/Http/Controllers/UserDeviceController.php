<?php

namespace App\Http\Controllers;

use App\Models\UserDevice;
use App\Models\Domain;
use Illuminate\Http\Request;

class UserDeviceController extends Controller
{
    public function index(Request $request)
    {
        $selectedDomainId = $request->integer('domain_id') ?: null;
        $selectedDomain = $selectedDomainId ? Domain::find($selectedDomainId) : null;
        $devices = UserDevice::with('domain')
            ->when($selectedDomainId, fn ($query) => $query->where('domain_id', $selectedDomainId))
            ->latest('last_seen_at')
            ->paginate(30)
            ->withQueryString();

        return view('user-devices.index', compact('devices', 'selectedDomain', 'selectedDomainId'));
    }

    public function create()
    {
        $domain = app('activeDomain');
        return view('user_devices.create', compact('domain'));
    }

    public function store(Request $request)
    {
        $domain = app('activeDomain');
        $validated = $request->validate([
            'device_id' => 'required|string|max:255',
            'email' => 'nullable|email',
            'fcm_token' => 'required|string',
        ]);

        $validated['domain_id'] = $domain->id;
        $validated['email'] = isset($validated['email']) ? strtolower($validated['email']) : null;
        $validated['last_seen_at'] = now();
        UserDevice::create($validated);

        return redirect()->route('user-devices.index')->with('success', 'Device added successfully.');
    }

    public function edit(UserDevice $userDevice)
    {
        $domain = app('activeDomain');
        abort_unless($userDevice->domain_id === $domain->id, 403);

        return view('user_devices.edit', compact('userDevice', 'domain'));
    }

    public function update(Request $request, UserDevice $userDevice)
    {
        $domain = app('activeDomain');
        abort_unless($userDevice->domain_id === $domain->id, 403);

        $validated = $request->validate([
            'device_id' => 'required|string|max:255',
            'email' => 'nullable|email',
            'fcm_token' => 'required|string',
        ]);

        $validated['email'] = isset($validated['email']) ? strtolower($validated['email']) : null;
        $validated['last_seen_at'] = now();
        $userDevice->update($validated);

        return redirect()->route('user-devices.index')->with('success', 'Device updated successfully.');
    }

    public function destroy(UserDevice $userDevice)
    {
        $domainId = $userDevice->domain_id;
        $userDevice->delete();
        return redirect()->route('user-devices.index', ['domain_id' => $domainId])->with('success', 'Device deleted.');
    }
}
