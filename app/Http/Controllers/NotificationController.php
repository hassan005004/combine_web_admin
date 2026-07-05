<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationLog;
use App\Models\NotificationSetting;
use App\Models\Domain;
use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $selectedDomainId = $request->integer('domain_id') ?: null;
        $selectedDomain = $selectedDomainId ? Domain::find($selectedDomainId) : null;
        $notifications = Notification::with('logs')
            ->when($selectedDomainId, fn ($query) => $query->where('domain_id', $selectedDomainId))
            ->latest()
            ->get();

        return view('notifications.index', compact('notifications', 'selectedDomain', 'selectedDomainId'));
    }

    public function show(Notification $notification)
    {
        return view('notifications.show', compact('notification'));
    }

    public function create(Request $request)
    {
        $domains = Domain::orderBy('title')->get();
        $selectedDomainId = $request->integer('domain_id') ?: null;

        return view('notifications.form', compact('domains', 'selectedDomainId'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $validated['sent_at'] = now();

        $notification = Notification::create($validated);

        // Send to all users of this domain
        $this->sendToAllUsers($notification);

        return redirect()->route('notifications.index', ['domain_id' => $validated['domain_id']])->with('success', 'Notification sent successfully.');
    }

    public function edit(Notification $notification)
    {
        $domains = Domain::orderBy('title')->get();

        return view('notifications.form', compact('notification', 'domains'));
    }

    public function update(Request $request, Notification $notification)
    {
        $validated = $request->validate([
            'domain_id' => ['required', 'exists:domains,id'],
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $notification->update($validated);

        // resend on update
        $this->sendToAllUsers($notification);

        $notification->update(['sent_at' => now()]);

        return redirect()->route('notifications.index', ['domain_id' => $validated['domain_id']])->with('success', 'Notification updated and resent.');
    }

    public function resend(Notification $notification)
    {
        $this->sendToAllUsers($notification);

        $notification->update(['sent_at' => now()]);

        return redirect()->back()->with('success', 'Notification resent successfully.');
    }

    public function destroy(Notification $notification)
    {
        $domainId = $notification->domain_id;
        $notification->delete();

        return redirect()->route('notifications.index', ['domain_id' => $domainId])->with('success', 'Notification deleted successfully.');
    }

    public function sendToAllUsers(Notification $notification)
    {
        $domainId = $notification->domain_id;
        
        // Get Firebase settings for this domain
        $settings = NotificationSetting::where('domain_id', $domainId)->first();
        if (!$settings || !Storage::disk('public')->exists($settings->services_file)) {
            \Log::warning("Missing Firebase service file for domain ID {$domainId}");
            return;
        }

        // Load Firebase credentials
        $serviceFile = Storage::disk('public')->path($settings->services_file);
        $serviceAccount = json_decode(file_get_contents($serviceFile), true);

        // Get access token
        $accessToken = $this->getFirebaseAccessToken($serviceAccount);

        // Get all saved FCM tokens for this entry.
        $devices = UserDevice::where('domain_id', $domainId)
            ->whereNotNull('fcm_token')
            ->get(['id', 'fcm_token']);

        if ($devices->isEmpty()) {
            \Log::info("No FCM tokens found for domain ID {$domainId}");
            return;
        }

        $this->sendFirebaseNotifications($notification, $devices, $notification->title, $notification->message, $accessToken, $serviceAccount['project_id']);
    }


    // private function sendToAllUsers(Notification $notification)
    // {
        // $users = User::where('domain_id', $notification->domain_id)->get();

        // if ($users->isEmpty()) return;

        // LaravelNotification::send($users, new SendUserNotification($notification->title, $notification->message));
    // }

    private function getFirebaseAccessToken(array $serviceAccount): string
    {
        $jwtHeader = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $now = time();
        $jwtClaim = base64_encode(json_encode([
            'iss' => $serviceAccount['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));

        $jwtUnsigned = $jwtHeader . '.' . $jwtClaim;
        openssl_sign($jwtUnsigned, $jwtSignature, $serviceAccount['private_key'], 'SHA256');
        $jwt = $jwtUnsigned . '.' . base64_encode($jwtSignature);

        // Get OAuth2 token
        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);

        return $response->json('access_token');
    }

    private function sendFirebaseNotifications(Notification $notification, $devices, string $title, string $body, string $accessToken, string $projectId)
    {
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        foreach ($devices->chunk(100) as $chunk) {
            foreach ($chunk as $device) {
                $fcmNotification = [
                    'title' => $title,
                    'body'  => $body,
                ];

                if ($notification->image_url) {
                    $fcmNotification['image'] = $notification->image_url;
                }

                $response = Http::withToken($accessToken)->post($url, [
                    'message' => [
                        'token'        => $device->fcm_token,
                        'notification' => $fcmNotification,
                    ],
                ]);

                // Parse FCM response
                $success = $response->successful();

                $responseBody = $response->json();
                $errorReason = $success ? null : ($responseBody['error']['message'] ?? 'Unknown error');

                // Log each attempt
                NotificationLog::create([
                    'notification_id' => $notification->id,
                    'user_id'         => $device->id,
                    'fcm_token'       => $device->fcm_token,
                    'success'         => $success,
                    'response'        => $errorReason,
                ]);
            }
        }
    }

}
