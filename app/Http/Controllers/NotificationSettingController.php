<?php

namespace App\Http\Controllers;

use App\Models\NotificationSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NotificationSettingController extends Controller
{
    public function index()
    {
        $domain = app('activeDomain');
        $notificationSettings = NotificationSetting::where('domain_id', $domain->id)->latest()->paginate(10);
        return view('notification-settings.index', compact('notificationSettings', 'domain'));
    }

    public function create()
    {
        $domain = app('activeDomain');
        return view('notification-settings.form', compact('domain'));
    }

    public function store(Request $request)
    {
        $domain = app('activeDomain');
        $validated = $request->validate([
            'services_file' => 'required|file|mimes:json,txt,pem|max:2048', // validate file type and size
            'token' => 'nullable|string',
            'token_expiry' => 'nullable|date',
        ]);

        if ($request->hasFile('services_file')) {
            $path = $request->file('services_file')->store('services_files', 'public'); 
            $validated['services_file'] = $path;
        }

        $validated['domain_id'] = $domain->id;
        NotificationSetting::create($validated);

        return redirect()->route('notification-settings.index')->with('success', 'Notification settings saved.');
    }

    public function edit(NotificationSetting $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);
        return view('notification-settings.form', compact('notification', 'domain'));
    }

    public function update(Request $request, NotificationSetting $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);

        $validated = $request->validate([
            'services_file' => 'nullable|file|mimes:json,txt,pem|max:2048',
            'token' => 'nullable|string',
            'token_expiry' => 'nullable|date',
        ]);

        if ($request->hasFile('services_file')) {
            // Optionally delete old file
            if ($notification->services_file && Storage::disk('public')->exists($notification->services_file)) {
                Storage::disk('public')->delete($notification->services_file);
            }

            $path = $request->file('services_file')->store('services_files', 'public');
            $validated['services_file'] = $path;
        }

        $notification->update($validated);

        return redirect()->route('notification-settings.index')->with('success', 'Notification updated.');
    }

    public function destroy(NotificationSetting $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);

        $notification->delete();
        return redirect()->route('notification-settings.index')->with('success', 'Notification deleted.');
    }
}
