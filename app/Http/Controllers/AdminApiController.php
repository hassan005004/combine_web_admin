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
use App\Services\GooglePlaySubscriptionVerifier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;

class AdminApiController extends Controller
{
    public function runMigrations()
    {
        $exitCode = Artisan::call('migrate', ['--force' => true]);
        $output = Artisan::output();

        if ($exitCode !== 0) {
            return response()->json([
                'message' => 'Database migration failed.',
                'output' => $output,
            ], 500);
        }

        return response()->json([
            'message' => 'Database migrations completed.',
            'output' => $output,
        ]);
    }

    public function dashboard()
    {
        return response()->json([
            'stats' => [
                'entries' => Domain::count(),
                'started_entries' => Domain::where('status', 'started')->count(),
                'apps' => Domain::whereIn('entry_type', ['app', 'both'])->count(),
                'websites' => Domain::whereIn('entry_type', ['website', 'both'])->count(),
                'memberships' => AppMembership::where('is_active', true)
                    ->where(fn ($query) => $query->whereNull('expires_at')->orWhere('expires_at', '>', now())->orWhere('grace_expires_at', '>', now()))
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
            'entries' => Domain::orderBy('sort_order')->orderBy('title')->get(),
        ]);
    }

    public function storeEntry(Request $request)
    {
        $data = $this->validateEntry($request);
        $data['application_id'] = $data['application_id'] ?: null;
        $data['primary_color'] = $data['primary_color'] ?? '#000000';
        $data['secondary_color'] = $data['secondary_color'] ?? '#ffffff';
        $data['show_in_apps_gallery'] = $request->boolean('show_in_apps_gallery');
        $data['sort_order'] = empty($data['sort_order']) ? ((int) Domain::max('sort_order') + 1) : $data['sort_order'];
        $data['ads_settings'] = $this->adsSettingsFromRequest($request);
        if (Schema::hasColumn('domains', 'billing_settings')) {
            $data['billing_settings'] = $this->billingSettingsFromRequest($request);
        }
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
        if (Schema::hasColumn('domains', 'billing_settings')) {
            $data['billing_settings'] = $this->billingSettingsFromRequest($request, $domain);
        }
        $this->applyEntryLogo($request, $data, $domain);
        $domain->update($data);

        return response()->json(['entry' => $domain->fresh()]);
    }

    public function reorderEntries(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:domains,id'],
        ]);

        foreach ($data['ids'] as $index => $id) {
            Domain::where('id', $id)->update(['sort_order' => $index + 1]);
        }

        return response()->json([
            'entries' => Domain::orderBy('sort_order')->orderBy('title')->get(),
        ]);
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
        $data = $this->validatedMembershipData($request);
        $membership = $this->matchingMembership($data) ?: new AppMembership();
        $this->releaseManualMembershipIdentifiers($data, $membership);

        $membership->fill($data);
        $membership->save();
        app(EntitySmtpMailer::class)->membershipChanged($membership->domain, $membership, 'created');

        return response()->json(['membership' => $membership], 201);
    }

    public function updateMembership(Request $request, AppMembership $membership)
    {
        $data = $this->validatedMembershipData($request, $membership);
        $this->releaseManualMembershipIdentifiers($data, $membership);
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

    public function cancelMembership(AppMembership $membership, GooglePlaySubscriptionVerifier $googlePlay)
    {
        $data = request()->validate([
            'reason' => ['nullable', 'string', 'max:255'],
            'details' => ['nullable', 'string'],
        ]);

        $playCancelled = false;
        if ($membership->provider === 'google_play' &&
            filled($membership->purchase_token) &&
            filled($membership->product_id)) {
            $playCancelled = $googlePlay->cancel(
                $membership->domain,
                $membership->purchase_token,
                $membership->product_id,
                $membership->domain?->billing_settings['google_play']['package_name'] ?? null,
                $data['reason'] ?? 'Cancelled by admin from ControlHub.'
            );
        }

        $membership->update([
            'is_active'    => false,
            'status' => 'cancelled',
            'cancelled_at' => now(),
            'cancellation_requested_at' => $membership->cancellation_requested_at ?: now(),
            'cancellation_reason' => $data['reason'] ?? $membership->cancellation_reason,
            'cancellation_details' => $data['details']
                ?? ($playCancelled ? 'Google Play subscription cancellation requested.' : $membership->cancellation_details),
            'cancellation_source' => 'admin',
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
        $data = $this->normalizePlanData($this->validatePlan($request));
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
        $data = $this->normalizePlanData($this->validatePlan($request));
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
        $hasLinkedMemberships = AppMembership::where('domain_id', $plan->domain_id)
            ->where('plan', $plan->name)
            ->exists();

        if ($hasLinkedMemberships) {
            throw ValidationException::withMessages([
                'plan' => 'This plan is already linked to memberships and cannot be removed.',
            ]);
        }

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

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'             => ['required', 'string', 'max:255'],
            'email'            => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'current_password' => ['nullable', 'string', 'current_password'],
        ]);

        if (strtolower($data['email']) !== strtolower($user->email) && empty($data['current_password'])) {
            throw ValidationException::withMessages([
                'current_password' => 'Current password is required when changing email.',
            ]);
        }

        $user->update([
            'name'  => $data['name'],
            'email' => strtolower($data['email']),
        ]);

        return response()->json([
            'success' => true,
            'user' => $user->fresh()->only(['name', 'email']),
        ]);
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
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'entry_type' => ['required', Rule::in(['app', 'website', 'both', 'other'])],
            'resources' => ['nullable', 'array'],
            'resources.*' => ['string', Rule::in(['users', 'plans', 'memberships', 'notifications', 'faqs', 'feedback', 'features', 'marketing', 'pages', 'notes', 'files', 'fcm', 'smtp', 'admob', 'billing', 'app-version'])],
            'status' => ['required', Rule::in(['pending', 'started', 'working'])],
            'sort_order' => ['nullable', 'integer', 'min:0'],
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
            'delete_policy' => ['nullable', 'string'],
            'about_us' => ['nullable', 'string'],
            'primary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'app_version' => ['nullable', 'string', 'max:20'],
            'min_build_code' => ['nullable', 'string', 'max:20'],
            'force_update' => ['boolean'],
            'social_links' => ['nullable', 'array'],
            'social_links.*' => ['nullable', 'url', 'max:500'],
        ]);

        $data['social_links'] = collect($data['social_links'] ?? [])
            ->only(['facebook', 'instagram', 'youtube', 'twitter', 'linkedin', 'whatsapp'])
            ->map(fn ($url) => trim((string) $url))
            ->filter()
            ->all();

        foreach ([
            'privacy_policy',
            'terms_conditions',
            'support_policy',
            'delete_policy',
            'about_us',
            'cache_ttl_hours',
            'primary_color',
            'secondary_color',
            'app_version',
            'min_build_code',
            'force_update',
            'billing_settings',
        ] as $column) {
            if (array_key_exists($column, $data) && ! Schema::hasColumn('domains', $column)) {
                unset($data[$column]);
            }
        }

        return $data;
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
            'yearly_price' => ['nullable', 'numeric', 'min:0'],
            'currency' => ['nullable', 'string', 'size:3'],
            'free_trial_days' => ['nullable', 'integer', 'min:0'],
            'yearly_free_months' => ['nullable', 'integer', 'min:0', 'max:12'],
            'tagline' => ['nullable', 'string', 'max:255'],
            'yearly_benefit' => ['nullable', 'string', 'max:255'],
            'google_play_monthly_product_id' => ['nullable', 'string', 'max:255'],
            'google_play_monthly_base_plan_id' => ['nullable', 'string', 'max:255'],
            'google_play_monthly_offer_id' => ['nullable', 'string', 'max:255'],
            'google_play_yearly_product_id' => ['nullable', 'string', 'max:255'],
            'google_play_yearly_base_plan_id' => ['nullable', 'string', 'max:255'],
            'google_play_yearly_offer_id' => ['nullable', 'string', 'max:255'],
            'google_play_tier_product_ids' => ['nullable', 'array'],
            'google_play_tier_product_ids.*.monthly_product_id' => ['nullable', 'string', 'max:255'],
            'google_play_tier_product_ids.*.monthly_base_plan_id' => ['nullable', 'string', 'max:255'],
            'google_play_tier_product_ids.*.monthly_offer_id' => ['nullable', 'string', 'max:255'],
            'google_play_tier_product_ids.*.yearly_product_id' => ['nullable', 'string', 'max:255'],
            'google_play_tier_product_ids.*.yearly_base_plan_id' => ['nullable', 'string', 'max:255'],
            'google_play_tier_product_ids.*.yearly_offer_id' => ['nullable', 'string', 'max:255'],
            'google_play_tier_product_ids.*.monthly_price' => ['nullable', 'numeric', 'min:0'],
            'google_play_tier_product_ids.*.currency' => ['nullable', 'string', 'size:3'],
            'country_prices' => ['nullable', 'array'],
            'country_prices.*.monthly_price' => ['nullable', 'numeric', 'min:0'],
            'country_prices.*.yearly_price' => ['nullable', 'numeric', 'min:0'],
            'country_prices.*.currency' => ['nullable', 'string', 'size:3'],
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

    private function normalizePlanData(array $data): array
    {
        $monthlyPrice = (float) ($data['monthly_price'] ?? 0);
        $yearlyFreeMonths = min(12, max(0, (int) ($data['yearly_free_months'] ?? 0)));
        $data['yearly_free_months'] = $yearlyFreeMonths;
        $data['yearly_price'] = round($monthlyPrice * max(0, 12 - $yearlyFreeMonths), 2);
        $data['currency'] = MembershipPlan::normalizeCurrencyCode($data['currency'] ?? null, 'USD') ?: 'USD';
        $data['free_trial_days'] = (int) ($data['free_trial_days'] ?? 0);

        if (Schema::hasColumn('membership_plans', 'google_play_tier_product_ids')) {
            $data['google_play_tier_product_ids'] = MembershipPlan::normalizeTierProductIds($data['google_play_tier_product_ids'] ?? []);
        } else {
            unset($data['google_play_tier_product_ids']);
        }

        if ($yearlyFreeMonths > 0 && empty($data['yearly_benefit'])) {
            $data['yearly_benefit'] = "{$yearlyFreeMonths} months free";
        }

        $countryPrices = [];
        foreach (($data['country_prices'] ?? []) as $countryCode => $price) {
            if (! is_array($price)) {
                continue;
            }

            $countryCode = MembershipPlan::normalizeCountryCode($countryCode);
            if (! $countryCode) {
                continue;
            }

            if (! array_key_exists('monthly_price', $price) || $price['monthly_price'] === null || $price['monthly_price'] === '') {
                continue;
            }

            $countryMonthly = (float) ($price['monthly_price'] ?? 0);
            $countryPrices[$countryCode] = [
                'monthly_price' => $countryMonthly,
                'yearly_price' => isset($price['yearly_price'])
                    ? (float) $price['yearly_price']
                    : round($countryMonthly * max(0, 12 - $yearlyFreeMonths), 2),
                'currency' => MembershipPlan::normalizeCurrencyCode($price['currency'] ?? null, $data['currency']) ?: $data['currency'],
            ];
        }

        $data['country_prices'] = $countryPrices;

        return $data;
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
            'entity_shares.*.notes' => ['nullable', 'string', 'max:2000'],
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
                    'notes' => $entityShare['notes'] ?? null,
                ]
            );

            $keptIds[] = $record->id;
        }

        StaffUserEntity::where('user_id', $user->id)
            ->when($keptIds, fn ($query) => $query->whereNotIn('id', $keptIds))
            ->delete();
    }

    private function validatedMembershipData(Request $request, ?AppMembership $membership = null): array
    {
        $data = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'plan' => ['required', 'string', 'max:255'],
            'billing_period' => ['nullable', 'string', 'in:monthly,yearly'],
            'provider' => ['nullable', 'string', 'max:50'],
            'status' => ['nullable', 'string', 'max:50'],
            'product_id' => ['nullable', 'string', 'max:255'],
            'base_plan_id' => ['nullable', 'string', 'max:255'],
            'offer_id' => ['nullable', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'size:2'],
            'currency' => ['nullable', 'string', 'size:3'],
            'amount_paid' => ['nullable', 'numeric', 'min:0'],
            'expires_at' => ['nullable', 'date'],
            'grace_expires_at' => ['nullable', 'date'],
            'is_active' => ['boolean'],
        ]);

        $email = isset($data['email']) ? strtolower(trim((string) $data['email'])) : null;
        $deviceId = trim((string) ($data['device_id'] ?? ''));

        if ($email === '' && $deviceId === '') {
            throw ValidationException::withMessages([
                'email' => 'Add an email or device id so the app can match this membership.',
            ]);
        }

        $isActive = $request->boolean('is_active');
        $provider = trim((string) ($data['provider'] ?? 'manual')) ?: 'manual';
        $status = trim((string) ($data['status'] ?? ($isActive ? 'active' : 'expired'))) ?: ($isActive ? 'active' : 'expired');

        $payload = [
            'domain_id' => (int) $data['domain_id'],
            'email' => $email ?: null,
            'device_id' => $deviceId ?: null,
            'plan' => trim((string) $data['plan']),
            'billing_period' => $data['billing_period'] ?? null,
            'provider' => $provider,
            'status' => $status,
            'product_id' => $this->nullableTrim($data['product_id'] ?? null),
            'base_plan_id' => $this->nullableTrim($data['base_plan_id'] ?? null),
            'offer_id' => $this->nullableTrim($data['offer_id'] ?? null),
            'country_code' => MembershipPlan::normalizeCountryCode($data['country_code'] ?? null),
            'currency' => MembershipPlan::normalizeCurrencyCode($data['currency'] ?? null, null),
            'amount_paid' => $data['amount_paid'] ?? null,
            'is_active' => $isActive,
            'expires_at' => $data['expires_at'] ?? null,
            'grace_expires_at' => $data['grace_expires_at'] ?? null,
            'last_verified_at' => $provider === 'manual' ? now() : ($membership?->last_verified_at ?: now()),
            'raw_purchase' => $provider === 'manual'
                ? ['source' => 'admin_manual', 'ads_bypass' => true, 'updated_at' => now()->toIso8601String()]
                : ($membership?->raw_purchase ?? null),
            'cancelled_at' => $isActive ? null : ($membership?->cancelled_at ?: now()),
            'cancellation_requested_at' => $isActive ? null : ($membership?->cancellation_requested_at ?: now()),
            'cancellation_reason' => $isActive ? null : ($membership?->cancellation_reason),
            'cancellation_details' => $isActive ? null : ($membership?->cancellation_details),
        ];

        if (! $isActive) {
            $payload['cancellation_source'] = $membership?->cancellation_source ?: 'admin';
        }

        return $payload;
    }

    private function matchingMembership(array $data): ?AppMembership
    {
        $query = AppMembership::where('domain_id', $data['domain_id']);

        return $query
            ->where(function ($query) use ($data) {
                if (! empty($data['device_id'])) {
                    $query->where('device_id', $data['device_id']);
                }

                if (! empty($data['email'])) {
                    empty($data['device_id'])
                        ? $query->where('email', $data['email'])
                        : $query->orWhere('email', $data['email']);
                }
            })
            ->first();
    }

    private function releaseManualMembershipIdentifiers(array $data, AppMembership $target): void
    {
        $query = AppMembership::where('domain_id', $data['domain_id']);

        if ($target->exists) {
            $query->where('id', '!=', $target->getKey());
        }

        $conflicts = $query
            ->where(function ($query) use ($data) {
                if (! empty($data['device_id'])) {
                    $query->where('device_id', $data['device_id']);
                }

                if (! empty($data['email'])) {
                    empty($data['device_id'])
                        ? $query->where('email', $data['email'])
                        : $query->orWhere('email', $data['email']);
                }
            })
            ->get();

        foreach ($conflicts as $conflict) {
            if (! empty($data['device_id']) && $conflict->device_id === $data['device_id']) {
                $conflict->device_id = null;
            }

            if (! empty($data['email']) && $conflict->email === $data['email']) {
                $conflict->email = null;
            }

            $conflict->save();
        }
    }

    private function nullableTrim(mixed $value): ?string
    {
        $text = trim((string) $value);

        return $text === '' ? null : $text;
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

        $settings['adsense'] = [
            'enabled' => $request->boolean('ads.adsense.enabled'),
            'client_id' => $request->input('ads.adsense.client_id'),
            'slot_id' => $request->input('ads.adsense.slot_id'),
            'format' => $request->input('ads.adsense.format', 'auto'),
        ];

        return $settings;
    }

    private function billingSettingsFromRequest(Request $request, ?Domain $domain = null): array
    {
        $existing = $domain?->billing_settings ?? [];
        $existingGoogle = $existing['google_play'] ?? [];
        $serviceAccountJson = $request->input('billing.google_play.service_account_json');

        if (($serviceAccountJson === null || trim((string) $serviceAccountJson) === '') && ! empty($existingGoogle['service_account_json'])) {
            $serviceAccountJson = $existingGoogle['service_account_json'];
        }

        return [
            'enabled' => $request->boolean('billing.enabled'),
            'grace_days' => max(0, (int) $request->input('billing.grace_days', $existing['grace_days'] ?? 3)),
            'google_play' => [
                'enabled' => $request->boolean('billing.google_play.enabled'),
                'package_name' => trim((string) $request->input(
                    'billing.google_play.package_name',
                    $existingGoogle['package_name'] ?? $request->input('application_id')
                )),
                'service_account_json' => $serviceAccountJson,
            ],
        ];
    }
}
