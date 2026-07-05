<?php

namespace App\Http\Controllers;

use App\Models\NotificationSetting;
use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NotificationSettingController extends Controller
{
    public function index(Request $request)
    {
        $selectedDomainId = $request->integer('domain_id') ?: null;
        $selectedDomain = $selectedDomainId ? Domain::find($selectedDomainId) : null;
        $notificationSettings = NotificationSetting::with('domain')
            ->when($selectedDomainId, fn ($query) => $query->where('domain_id', $selectedDomainId))
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return view('notification-settings.index', compact('notificationSettings', 'selectedDomain', 'selectedDomainId'));
    }

    public function create(Request $request)
    {
        $domains = Domain::orderBy('title')->get();
        $selectedDomainId = $request->integer('domain_id') ?: null;

        return view('notification-settings.form', compact('domains', 'selectedDomainId'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'services_file' => 'required|file|mimes:json,txt,pem|max:2048', // validate file type and size
            'token' => 'nullable|string',
            'token_expiry' => 'nullable|date',
        ]);

        if ($request->hasFile('services_file')) {
            $path = $request->file('services_file')->store('services_files', 'public'); 
            $validated['services_file'] = $path;
        }

        NotificationSetting::create($validated);

        return redirect()->route('notification-settings.index', ['domain_id' => $validated['domain_id']])->with('success', 'Notification settings saved.');
    }

    public function edit(NotificationSetting $notification)
    {
        $domains = Domain::orderBy('title')->get();

        return view('notification-settings.form', compact('notification', 'domains'));
    }

    public function update(Request $request, NotificationSetting $notification)
    {
        $validated = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
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

        return redirect()->route('notification-settings.index', ['domain_id' => $validated['domain_id']])->with('success', 'Notification updated.');
    }

    public function destroy(NotificationSetting $notification)
    {
        $domainId = $notification->domain_id;
        $notification->delete();
        return redirect()->route('notification-settings.index', ['domain_id' => $domainId])->with('success', 'Notification deleted.');
    }
}
