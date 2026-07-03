<?php

namespace App\Http\Controllers;

use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\MembershipFeature;
use App\Models\MembershipPlan;
use App\Models\Notification;
use App\Models\NotificationSetting;
use App\Models\EntryNote;
use App\Models\EntitySmtpSetting;
use App\Models\StaffUserEntity;
use App\Models\User;
use App\Models\UserDevice;
use App\Services\EntitySmtpMailer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
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
        $data['application_id'] = $data['application_id'] ?: null;
        $data['primary_color'] = $data['primary_color'] ?? '#000000';
        $data['secondary_color'] = $data['secondary_color'] ?? '#ffffff';
        $data['show_in_apps_gallery'] = $request->boolean('show_in_apps_gallery');
        $data['ads_settings'] = $this->adsSettingsFromRequest($request);
        $this->applyEntryLogo($request, $data);

        $entry = Domain::create($data);

        return response()->json(['entry' => $entry], 201);
    }

    public function updateEntry(Request $request, Domain $domain)
    {
        $data = $this->validateEntry($request, $domain);
        $data['application_id'] = $data['application_id'] ?: null;
        $data['primary_color'] = $data['primary_color'] ?? ($domain->primary_color ?: '#000000');
        $data['secondary_color'] = $data['secondary_color'] ?? ($domain->secondary_color ?: '#ffffff');
        $data['show_in_apps_gallery'] = $request->boolean('show_in_apps_gallery');
        $data['ads_settings'] = $this->adsSettingsFromRequest($request);
        $this->applyEntryLogo($request, $data, $domain);
        $domain->update($data);

        return response()->json(['entry' => $domain->fresh()]);
    }

    public function destroyEntry(Domain $domain)
    {
        if ($domain->logo_path && Storage::disk('public')->exists($domain->logo_path)) {
            Storage::disk('public')->delete($domain->logo_path);
        }

        $domain->delete();

        return response()->json(['success' => true]);
    }

    public function entryDetails(Domain $domain)
    {
        return response()->json([
            'entry'                 => $domain,
            'memberships'           => \App\Models\AppMembership::where('domain_id', $domain->id)->latest()->get(),
            'plans'                 => \App\Models\MembershipPlan::with('features')->where('domain_id', $domain->id)->orderBy('sorting')->get(),
            'features'              => MembershipFeature::where('domain_id', $domain->id)->orderBy('sorting')->get(),
            'notifications'         => Notification::with('logs')->where('domain_id', $domain->id)->latest()->get(),
            'notification_settings' => NotificationSetting::where('domain_id', $domain->id)->latest()->get(),
            'smtp_setting'          => EntitySmtpSetting::where('domain_id', $domain->id)->first(),
            'devices'               => UserDevice::where('domain_id', $domain->id)->latest('last_seen_at')->get(),
            'pages'                 => \App\Models\Page::where('domain_id', $domain->id)->latest()->get(),
            'faqs'                  => \App\Models\Faq::where('domain_id', $domain->id)->orderBy('sorting')->get(),
            'feedbacks'             => \App\Models\Feedback::where('domain_id', $domain->id)->latest()->get(),
            'feature_requests'      => \App\Models\FeatureRequest::where('domain_id', $domain->id)->latest()->get(),
            'notes'                 => EntryNote::with('user:id,name,email')
                ->where('domain_id', $domain->id)
                ->where(function ($query) {
                    $query->where('visibility', 'all')
                        ->orWhere('user_id', request()->user()->id);
                })
                ->latest()
                ->get(),
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

        $membership = AppMembership::create($data);
        app(EntitySmtpMailer::class)->membershipChanged($membership->domain, $membership, 'created');

        return response()->json(['membership' => $membership], 201);
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
        app(EntitySmtpMailer::class)->membershipChanged($membership->domain, $membership->fresh(), 'updated');

        return response()->json(['membership' => $membership->fresh()]);
    }

    public function destroyMembership(AppMembership $membership)
    {
        app(EntitySmtpMailer::class)->membershipChanged($membership->domain, $membership, 'deleted by admin');
        $membership->delete();

        return response()->json(['success' => true]);
    }

    public function cancelMembership(AppMembership $membership)
    {
        $data = request()->validate([
            'reason' => ['nullable', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        $membership->update([
            'is_active'    => false,
            'cancelled_at' => now(),
            'cancellation_requested_at' => $membership->cancellation_requested_at ?: now(),
            'cancellation_reason' => $data['reason'] ?? $membership->cancellation_reason,
            'cancellation_details' => $data['details'] ?? $membership->cancellation_details,
            'cancellation_source' => $membership->cancellation_source ?: 'admin',
        ]);
        app(EntitySmtpMailer::class)->membershipChanged($membership->domain, $membership->fresh(), 'cancelled by admin');

        return response()->json(['membership' => $membership->fresh()]);
    }

    public function applyPromo(Request $request, AppMembership $membership)
    {
        $data = $request->validate([
            'promo_code'     => ['required', 'string', 'max:50'],
            'promo_discount' => ['required', 'numeric', 'min:0'],
            'amount_paid'    => ['required', 'numeric', 'min:0'],
        ]);

        $membership->update([
            'promo_code'     => $data['promo_code'],
            'promo_discount' => $data['promo_discount'],
            'amount_paid'    => $data['amount_paid'],
        ]);
        app(EntitySmtpMailer::class)->membershipChanged($membership->domain, $membership->fresh(), 'promo applied', [
            'Promo code' => $data['promo_code'],
            'Promo discount' => $data['promo_discount'],
            'Amount paid' => $data['amount_paid'],
        ]);

        return response()->json(['membership' => $membership->fresh()]);
    }

    public function storeSmtpSetting(Request $request, Domain $domain)
    {
        $existing = EntitySmtpSetting::where('domain_id', $domain->id)->first();
        $data = $this->validateSmtpSetting($request, $existing);
        $data['domain_id'] = $domain->id;
        $data['is_active'] = $request->boolean('is_active');

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $setting = EntitySmtpSetting::updateOrCreate(
            ['domain_id' => $domain->id],
            $data
        );

        return response()->json(['setting' => $setting->fresh()]);
    }

    public function testSmtpSetting(Request $request, Domain $domain, EntitySmtpMailer $mailer)
    {
        $setting = EntitySmtpSetting::where('domain_id', $domain->id)->firstOrFail();
        $data = $request->validate([
            'to_email' => ['nullable', 'email'],
        ]);

        $mailer->test($setting, $data['to_email'] ?? null);

        return response()->json(['success' => true, 'message' => 'SMTP test email sent successfully.']);
    }

    public function storePlan(Request $request)
    {
        $data = $this->validatePlan($request);
        $features = $request->has('features') ? ($data['features'] ?? []) : null;
        unset($data['features']);
        $data['is_active'] = $request->boolean('is_active');

        $plan = MembershipPlan::create($data);
        if (is_array($features)) {
            $this->syncPlanFeatures($plan, $features);
        }

        return response()->json(['plan' => $plan->fresh('features')], 201);
    }

    public function updatePlan(Request $request, MembershipPlan $plan)
    {
        $data = $this->validatePlan($request);
        $features = $request->has('features') ? ($data['features'] ?? []) : null;
        unset($data['features']);
        $data['is_active'] = $request->boolean('is_active');
        $plan->update($data);
        if (is_array($features)) {
            $this->syncPlanFeatures($plan, $features);
        }

        return response()->json(['plan' => $plan->fresh('features')]);
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
            'domain_id'    => ['required', 'exists:domains,id'],
            'title'        => ['nullable', 'string', 'max:255'],
            'message'      => ['required', 'string'],
            'image'        => ['nullable', 'file', 'image', 'max:4096'],
            'image_url'    => ['nullable', 'string', 'max:2048'],
            'name'         => ['nullable', 'string', 'max:255'],
            'scheduled_at' => ['nullable', 'date'],
        ]);

        // Handle image upload — uploaded file takes priority over pasted URL
        if ($request->hasFile('image')) {
            $data['image_url'] = Storage::disk('public')->url(
                $request->file('image')->store('notification-images', 'public')
            );
        }
        unset($data['image']);

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
            'services_file' => ['nullable', 'file', 'mimes:json,txt,pem', 'max:2048'],
            'token' => ['nullable', 'string'],
            'token_expiry' => ['nullable', 'date'],
        ]);

        $setting = NotificationSetting::where('domain_id', $data['domain_id'])->first();

        if (! $setting && ! $request->hasFile('services_file')) {
            throw ValidationException::withMessages([
                'services_file' => 'The services file is required until an FCM setting is saved.',
            ]);
        }

        if ($request->hasFile('services_file')) {
            if ($setting?->services_file && Storage::disk('public')->exists($setting->services_file)) {
                Storage::disk('public')->delete($setting->services_file);
            }

            $data['services_file'] = $request->file('services_file')->store('services_files', 'public');
        } else {
            unset($data['services_file']);
        }

        if ($setting) {
            $setting->update($data);
        } else {
            $setting = NotificationSetting::create($data);
        }

        return response()->json(['setting' => $setting->fresh()], $setting->wasRecentlyCreated ? 201 : 200);
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

    public function staffUsers()
    {
        return response()->json([
            'users' => User::with(['staffEntities.domain:id,title,application_id,entry_type'])
                ->latest()
                ->get(['id', 'name', 'email', 'created_at']),
            'entries' => Domain::orderBy('title')->get(['id', 'title', 'application_id', 'entry_type']),
        ]);
    }

    public function storeStaffUser(Request $request)
    {
        $data = $this->validateStaffUser($request);

        $user = User::create([
            'name' => $data['name'],
            'email' => strtolower($data['email']),
            'password' => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);

        $this->syncStaffEntityShares($user, $data['entity_shares'] ?? []);

        return response()->json([
            'user' => $user->fresh(['staffEntities.domain:id,title,application_id,entry_type']),
        ], 201);
    }

    public function updateStaffUser(Request $request, User $user)
    {
        $data = $this->validateStaffUser($request, $user);
        $payload = [
            'name' => $data['name'],
            'email' => strtolower($data['email']),
        ];

        if (! empty($data['password'])) {
            $payload['password'] = Hash::make($data['password']);
        }

        $user->update($payload);
        $this->syncStaffEntityShares($user, $data['entity_shares'] ?? []);

        return response()->json([
            'user' => $user->fresh(['staffEntities.domain:id,title,application_id,entry_type']),
        ]);
    }

    public function destroyStaffUser(Request $request, User $user)
    {
        if ($request->user()->id === $user->id) {
            throw ValidationException::withMessages([
                'user' => 'You cannot delete your own staff account.',
            ]);
        }

        $user->delete();

        return response()->json(['success' => true]);
    }

    public function storeNote(Request $request, Domain $domain)
    {
        $data = $this->validateNote($request);
        $data['domain_id'] = $domain->id;
        $data['user_id'] = $request->user()->id;

        return response()->json([
            'note' => EntryNote::create($data)->load('user:id,name,email'),
        ], 201);
    }

    public function updateNote(Request $request, Domain $domain, EntryNote $note)
    {
        $this->authorizeNote($request, $note);
        $note->update($this->validateNote($request));

        return response()->json(['note' => $note->fresh('user:id,name,email')]);
    }

    public function destroyNote(Request $request, Domain $domain, EntryNote $note)
    {
        $this->authorizeNote($request, $note);
        $note->delete();

        return response()->json(['success' => true]);
    }

    public function updateEmail(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($request->user()->id)],
            'password' => ['required', 'string', 'current_password'],
        ]);

        $request->user()->update(['email' => $data['email']]);

        return response()->json(['success' => true]);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password'      => ['required', 'string', 'current_password'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
            'password_confirmation' => ['required', 'string'],
        ]);

        $request->user()->update([
            'password' => \Illuminate\Support\Facades\Hash::make($request->password),
        ]);

        return response()->json(['success' => true]);
    }

    private function validateEntry(Request $request, ?Domain $domain = null): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'entry_type' => ['required', Rule::in(['app', 'website', 'both', 'other'])],
            'url' => ['nullable', 'url'],
            'google_play_url' => ['nullable', 'url'],
            'app_store_url' => ['nullable', 'url'],
            'application_id' => ['nullable', 'string', 'max:255', Rule::unique('domains', 'application_id')->ignore($domain?->id)],
            'logo' => ['nullable', 'image', 'max:2048'],
            'remove_logo' => ['boolean'],
            'show_in_apps_gallery' => ['boolean'],
            'cache_ttl_hours' => ['required', 'integer', 'min:1'],
            'seo_title' => ['nullable', 'string'],
            'seo_description' => ['nullable', 'string'],
            'seo_keywords' => ['nullable', 'string'],
            'privacy_policy' => ['nullable', 'string'],
            'terms_conditions' => ['nullable', 'string'],
            'support_policy' => ['nullable', 'string'],
            'about_us' => ['nullable', 'string'],
            'primary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'app_version' => ['nullable', 'string', 'max:20'],
            'min_build_code' => ['nullable', 'string', 'max:20'],
            'force_update' => ['boolean'],
        ]);
    }

    private function applyEntryLogo(Request $request, array &$data, ?Domain $domain = null): void
    {
        unset($data['logo'], $data['remove_logo']);

        if ($request->boolean('remove_logo') && $domain?->logo_path) {
            if (Storage::disk('public')->exists($domain->logo_path)) {
                Storage::disk('public')->delete($domain->logo_path);
            }
            $data['logo_path'] = null;
        }

        if ($request->hasFile('logo')) {
            if ($domain?->logo_path && Storage::disk('public')->exists($domain->logo_path)) {
                Storage::disk('public')->delete($domain->logo_path);
            }

            $data['logo_path'] = $request->file('logo')->store('entity-logos', 'public');
        }
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
            'features' => ['nullable', 'array'],
            'features.*.id' => ['nullable', 'integer', 'exists:membership_features,id'],
            'features.*.icon' => ['nullable', 'string', 'max:255'],
            'features.*.text' => ['nullable', 'string', 'max:255'],
            'features.*.sorting' => ['nullable', 'integer', 'min:0'],
            'features.*.is_active' => ['boolean'],
        ]);
    }

    private function validateFeature(Request $request): array
    {
        return $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'membership_plan_id' => ['nullable', 'exists:membership_plans,id'],
            'icon' => ['nullable', 'string', 'max:255'],
            'text' => ['nullable', 'string', 'max:255'],
            'sorting' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);
    }

    private function validateSmtpSetting(Request $request, ?EntitySmtpSetting $setting = null): array
    {
        return $request->validate([
            'admin_email' => ['required', 'email', 'max:255'],
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['nullable', Rule::in(['', 'tls', 'ssl'])],
            'username' => ['nullable', 'string', 'max:255'],
            'password' => [$setting ? 'nullable' : 'required', 'string', 'max:2000'],
            'from_email' => ['required', 'email', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);
    }

    private function syncPlanFeatures(MembershipPlan $plan, array $features): void
    {
        $keptIds = [];

        foreach ($features as $index => $feature) {
            $payload = [
                'domain_id' => $plan->domain_id,
                'membership_plan_id' => $plan->id,
                'icon' => $feature['icon'] ?? 'star',
                'text' => $feature['text'] ?? null,
                'sorting' => $feature['sorting'] ?? $index,
                'is_active' => $feature['is_active'] ?? true,
            ];

            if (! empty($feature['id'])) {
                $record = MembershipFeature::where('id', $feature['id'])
                    ->where('domain_id', $plan->domain_id)
                    ->first();

                if ($record) {
                    $record->update($payload);
                    $keptIds[] = $record->id;
                    continue;
                }
            }

            $keptIds[] = MembershipFeature::create($payload)->id;
        }

        MembershipFeature::where('domain_id', $plan->domain_id)
            ->where('membership_plan_id', $plan->id)
            ->when($keptIds, fn ($query) => $query->whereNotIn('id', $keptIds))
            ->delete();
    }

    private function validateStaffUser(Request $request, ?User $user = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'password' => [$user ? 'nullable' : 'required', 'string', 'min:8'],
            'entity_shares' => ['nullable', 'array'],
            'entity_shares.*.domain_id' => ['required', 'exists:domains,id'],
            'entity_shares.*.share_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);
    }

    private function syncStaffEntityShares(User $user, array $entityShares): void
    {
        $keptIds = [];

        foreach ($entityShares as $entityShare) {
            if (empty($entityShare['domain_id'])) {
                continue;
            }

            $record = StaffUserEntity::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'domain_id' => $entityShare['domain_id'],
                ],
                [
                    'share_percent' => $entityShare['share_percent'] ?? 0,
                ]
            );

            $keptIds[] = $record->id;
        }

        StaffUserEntity::where('user_id', $user->id)
            ->when($keptIds, fn ($query) => $query->whereNotIn('id', $keptIds))
            ->delete();
    }

    private function validateNote(Request $request): array
    {
        return $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'visibility' => ['required', Rule::in(['only_me', 'all'])],
        ]);
    }

    private function authorizeNote(Request $request, EntryNote $note): void
    {
        if ($note->domain_id !== (int) $request->route('domain')->id || $note->user_id !== $request->user()->id) {
            abort(403, 'You can only edit or delete your own notes.');
        }
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
