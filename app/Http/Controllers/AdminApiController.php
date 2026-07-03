<?php

namespace App\Http\Controllers;

use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\MembershipFeature;
use App\Models\MembershipPlan;
use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class AdminApiController extends Controller
{
    public function dashboard()
    {
        return response()->json([
            'stats' => [
                'entries' => Domain::count(),
                'apps' => Domain::whereIn('entry_type', ['app', 'both'])->count(),
                'websites' => Domain::whereIn('entry_type', ['website', 'both'])->count(),
                'memberships' => AppMembership::where('is_active', true)
                    ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now()))
                    ->count(),
                'membership_plans' => MembershipPlan::where('is_active', true)->count(),
                'users' => UserDevice::count(),
                'logged_in_users' => UserDevice::whereNotNull('email')->distinct('email')->count('email'),
                'guest_users' => UserDevice::whereNull('email')->count(),
                'active_now' => UserDevice::where('last_seen_at', '>=', now()->subMinutes(30))->count(),
                'active_today' => UserDevice::whereDate('last_seen_at', today())->count(),
                'active_7_days' => UserDevice::where('last_seen_at', '>=', now()->subDays(7))->count(),
                'active_30_days' => UserDevice::where('last_seen_at', '>=', now()->subDays(30))->count(),
            ],
            'recent_users' => UserDevice::with('domain:id,title')
                ->latest('last_seen_at')
                ->limit(10)
                ->get(),
        ]);
    }

    public function entries()
    {
        return response()->json([
            'entries' => Domain::latest()->get(),
        ]);
    }

    public function storeEntry(Request $request)
    {
        $data = $this->validateEntry($request);
        $data['ads_settings'] = $this->adsSettingsFromRequest($request);

        $entry = Domain::create($data);

        return response()->json(['entry' => $entry], 201);
    }

    public function updateEntry(Request $request, Domain $domain)
    {
        $data = $this->validateEntry($request, $domain);
        $data['ads_settings'] = $this->adsSettingsFromRequest($request);
        $domain->update($data);

        return response()->json(['entry' => $domain->fresh()]);
    }

    public function destroyEntry(Domain $domain)
    {
        $domain->delete();

        return response()->json(['success' => true]);
    }

    public function entryDetails(Domain $domain)
    {
        return response()->json([
            'entry' => $domain,
            'memberships' => AppMembership::where('domain_id', $domain->id)->latest()->get(),
            'plans' => MembershipPlan::where('domain_id', $domain->id)->orderBy('sorting')->get(),
            'features' => MembershipFeature::where('domain_id', $domain->id)->orderBy('sorting')->get(),
            'notifications' => Notification::with('logs')->where('domain_id', $domain->id)->latest()->get(),
            'notification_settings' => NotificationSetting::where('domain_id', $domain->id)->latest()->get(),
            'devices' => UserDevice::where('domain_id', $domain->id)->latest('last_seen_at')->get(),
        ]);
    }

    public function storeMembership(Request $request)
    {
        $data = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'email' => ['required', 'email'],
            'plan' => ['required', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);
        $data['email'] = strtolower($data['email']);
        $data['is_active'] = $request->boolean('is_active');

        return response()->json(['membership' => AppMembership::create($data)], 201);
    }

    public function updateMembership(Request $request, AppMembership $membership)
    {
        $data = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'email' => ['required', 'email'],
            'plan' => ['required', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);
        $data['email'] = strtolower($data['email']);
        $data['is_active'] = $request->boolean('is_active');
        $membership->update($data);

        return response()->json(['membership' => $membership->fresh()]);
    }

    public function destroyMembership(AppMembership $membership)
    {
        $membership->delete();

        return response()->json(['success' => true]);
    }

    public function storePlan(Request $request)
    {
        $data = $this->validatePlan($request);
        $data['is_active'] = $request->boolean('is_active');

        return response()->json(['plan' => MembershipPlan::create($data)], 201);
    }

    public function updatePlan(Request $request, MembershipPlan $plan)
    {
        $data = $this->validatePlan($request);
        $data['is_active'] = $request->boolean('is_active');
        $plan->update($data);

        return response()->json(['plan' => $plan->fresh()]);
    }

    public function destroyPlan(MembershipPlan $plan)
    {
        $plan->delete();

        return response()->json(['success' => true]);
    }

    public function storeFeature(Request $request)
    {
        $data = $this->validateFeature($request);
        $data['is_active'] = $request->boolean('is_active');

        return response()->json(['feature' => MembershipFeature::create($data)], 201);
    }

    public function updateFeature(Request $request, MembershipFeature $feature)
    {
        $data = $this->validateFeature($request);
        $data['is_active'] = $request->boolean('is_active');
        $feature->update($data);

        return response()->json(['feature' => $feature->fresh()]);
    }

    public function destroyFeature(MembershipFeature $feature)
    {
        $feature->delete();

        return response()->json(['success' => true]);
    }

    public function storeNotification(Request $request, NotificationController $sender)
    {
        $data = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'title' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string'],
        ]);
        $data['sent_at'] = now();
        $notification = Notification::create($data);
        $sender->sendToAllUsers($notification);

        return response()->json(['notification' => $notification->load('logs')], 201);
    }

    public function destroyNotification(Notification $notification)
    {
        $notification->delete();

        return response()->json(['success' => true]);
    }

    public function resendNotification(Notification $notification, NotificationController $sender)
    {
        $sender->sendToAllUsers($notification);
        $notification->update(['sent_at' => now()]);

        return response()->json(['notification' => $notification->fresh()->load('logs')]);
    }

    public function storeNotificationSetting(Request $request)
    {
        $data = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'services_file' => ['required', 'file', 'mimes:json,txt,pem', 'max:2048'],
            'token' => ['nullable', 'string'],
            'token_expiry' => ['nullable', 'date'],
        ]);

        $data['services_file'] = $request->file('services_file')->store('services_files', 'public');

        return response()->json(['setting' => NotificationSetting::create($data)], 201);
    }

    public function destroyNotificationSetting(NotificationSetting $setting)
    {
        if ($setting->services_file && Storage::disk('public')->exists($setting->services_file)) {
            Storage::disk('public')->delete($setting->services_file);
        }
        $setting->delete();

        return response()->json(['success' => true]);
    }

    public function destroyDevice(UserDevice $device)
    {
        $device->delete();

        return response()->json(['success' => true]);
    }

    private function validateEntry(Request $request, ?Domain $domain = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'entry_type' => ['required', Rule::in(['app', 'website', 'both'])],
            'url' => ['nullable', 'url'],
            'google_play_url' => ['nullable', 'url'],
            'app_store_url' => ['nullable', 'url'],
            'application_id' => ['required', 'string', 'max:255', Rule::unique('domains', 'application_id')->ignore($domain?->id)],
            'cache_ttl_hours' => ['required', 'integer', 'min:1'],
            'seo_title' => ['nullable', 'string'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'string'],
            'privacy_policy' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
            'support_policy' => ['nullable', 'string'],
            'about_us' => ['nullable', 'string'],
            'primary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);
    }

    private function validatePlan(Request $request): array
    {
        return $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'name' => ['required', 'string', 'max:255'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['required', 'numeric', 'min:0'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'yearly_benefit' => ['nullable', 'string', 'max:255'],
            'sorting' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);
    }

    private function validateFeature(Request $request): array
    {
        return $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'icon' => ['nullable', 'string', 'max:255'],
            'text' => ['nullable', 'string', 'max:255'],
            'sorting' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);
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
