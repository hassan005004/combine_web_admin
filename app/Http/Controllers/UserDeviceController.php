<?php

namespace App\Http\Controllers;

use App\Models\UserDevice;
use Illuminate\Http\Request;

class UserDeviceController extends Controller
{
    public function index()
    {
        $domain = app('activeDomain');
        $devices = UserDevice::where('domain_id', $domain->id)->latest()->paginate(20);
        return view('user_devices.index', compact('devices', 'domain'));
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
            'fcm_token' => 'required|string',
        ]);

        $validated['domain_id'] = $domain->id;
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
            'fcm_token' => 'required|string',
        ]);

        $userDevice->update($validated);

        return redirect()->route('user-devices.index')->with('success', 'Device updated successfully.');
    }

    public function destroy(UserDevice $userDevice)
    {
        $domain = app('activeDomain');
        abort_unless($userDevice->domain_id === $domain->id, 403);

        $userDevice->delete();
        return redirect()->route('user-devices.index')->with('success', 'Device deleted.');
    }
}
