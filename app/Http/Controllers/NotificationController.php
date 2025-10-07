<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationLog;
use App\Models\NotificationSetting;
use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification as LaravelNotification;
use App\Notifications\SendUserNotification; // custom notification class
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class NotificationController extends Controller
{
    public function index()
    {
        $domain = app('activeDomain');
        $notifications = Notification::where('domain_id', $domain->id)
            ->latest()
            ->get();

        return view('notifications.index', compact('notifications'));
    }

    public function show(Notification $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);

        return view('notifications.show', compact('notification'));
    }

    public function create()
    {
        return view('notifications.form');
    }

    public function store(Request $request)
    {
        $domain = app('activeDomain');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $validated['domain_id'] = $domain->id;
        $validated['sent_at'] = now();

        $notification = Notification::create($validated);

        // Send to all users of this domain
        $this->sendToAllUsers($notification);

        return redirect()->route('notifications.index')->with('success', 'Notification sent successfully.');
    }

    public function edit(Notification $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);

        return view('notifications.form', compact('notification'));
    }

    public function update(Request $request, Notification $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        $notification->update($validated);

        // resend on update
        $this->sendToAllUsers($notification);

        $notification->update(['sent_at' => now()]);

        return redirect()->route('notifications.index')->with('success', 'Notification updated and resent.');
    }

    public function resend(Notification $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);

        $this->sendToAllUsers($notification);

        $notification->update(['sent_at' => now()]);

        return redirect()->back()->with('success', 'Notification resent successfully.');
    }

    public function destroy(Notification $notification)
    {
        $domain = app('activeDomain');
        abort_unless($notification->domain_id === $domain->id, 403);

        $notification->delete();

        return redirect()->route('notifications.index')->with('success', 'Notification deleted successfully.');
    }

    private function sendToAllUsers(Notification $notification)
    {
        $domain = app('activeDomain');
        
        // Get Firebase settings for this domain
        $settings = NotificationSetting::where('domain_id', $domain->id)->first();
        if (!$settings || !Storage::disk('public')->exists($settings->services_file)) {
            \Log::warning("Missing Firebase service file for domain ID {$domain->id}");
            return;
        }

        // Load Firebase credentials
        $serviceFile = Storage::disk('public')->path($settings->services_file);
        $serviceAccount = json_decode(file_get_contents($serviceFile), true);

        // Get access token
        $accessToken = $this->getFirebaseAccessToken($serviceAccount);

        // Get all user tokens for this domain
        $tokens = UserDevice::where('domain_id', $domain->id)
            ->whereNotNull('fcm_token')
            ->pluck('fcm_token')
            ->toArray();

        if (empty($tokens)) {
            \Log::info("No FCM tokens found for domain ID {$domain->id}");
            return;
        }

        // Send notification in batches
        $this->sendFirebaseNotifications($notification, $tokens, $notification->title, $notification->message, $accessToken, $serviceAccount['project_id']);
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

    private function sendFirebaseNotifications(Notification $notification, array $tokens, string $title, string $body, string $accessToken, string $projectId)
    {
        $url = "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send";

        foreach (array_chunk($tokens, 100) as $chunk) { // FCM recommends batches
            foreach ($chunk as $token) {
                $response = Http::withToken($accessToken)->post($url, [
                    'message' => [
                        'token' => $token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                    ],
                ]);

                // Parse FCM response
                $success = $response->successful();

                $responseBody = $response->json();
                $errorReason = $success ? null : ($responseBody['error']['message'] ?? 'Unknown error');

                // Log each attempt
                NotificationLog::create([
                    'notification_id' => $notification->id,
                    'user_id' => UserDevice::where('fcm_token', $token)->value('id'),
                    'fcm_token' => $token,
                    'success' => $success,
                    'response' => $errorReason, 
                ]);
            }
        }
    }

}
