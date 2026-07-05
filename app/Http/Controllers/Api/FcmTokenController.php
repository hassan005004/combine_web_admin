<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Models\UserDevice;
use Illuminate\Http\Request;

class FcmTokenController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'fcm_token' => ['required', 'string'],
            'device_id' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $email = isset($validated['email']) ? strtolower($validated['email']) : null;
        $deviceId = $validated['device_id'] ?? hash('sha256', $validated['fcm_token']);

        $device = UserDevice::updateOrCreate(
            [
                'domain_id' => $domain->id,
                'device_id' => $deviceId,
            ],
            [
                'email' => $email,
                'fcm_token' => $validated['fcm_token'],
                'last_seen_at' => now(),
            ]
        );

        UserDevice::where('domain_id', $domain->id)
            ->where('fcm_token', $validated['fcm_token'])
            ->where('id', '!=', $device->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'FCM token saved.',
            'data' => [
                'id' => $device->id,
                'application_id' => $domain->application_id,
                'email' => $device->email,
                'device_id' => $device->device_id,
            ],
        ]);
    }

    public function touch(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'device_id'      => ['nullable', 'string', 'max:255'],
            'fcm_token'      => ['nullable', 'string'],
            'email'          => ['nullable', 'email'],
        ]);

        $domain  = Domain::where('application_id', $validated['application_id'])->firstOrFail();
        $email   = isset($validated['email']) ? strtolower($validated['email']) : null;
        $deviceId = $validated['device_id'] ?? null;
        $fcmToken = $validated['fcm_token'] ?? null;

        // Require at least one identifier
        if (empty($deviceId) && empty($fcmToken)) {
            return response()->json(['message' => 'device_id or fcm_token required.'], 422);
        }

        // Build the unique key to find or create the record
        $matchKey = [];
        $matchKey['domain_id'] = $domain->id;

        if (! empty($deviceId)) {
            $matchKey['device_id'] = $deviceId;
        } else {
            $matchKey['fcm_token'] = $fcmToken;
        }

        $fillData = ['last_seen_at' => now()];
        if ($email !== null)    $fillData['email']     = $email;
        if (! empty($fcmToken)) $fillData['fcm_token'] = $fcmToken;
        if (! empty($deviceId)) $fillData['device_id'] = $deviceId;

        // updateOrCreate so a device-only ping (no FCM) still registers the device
        $device = UserDevice::updateOrCreate($matchKey, $fillData);

        return response()->json([
            'success' => true,
            'message' => 'User activity updated.',
            'data'    => [
                'application_id' => $domain->application_id,
                'email'          => $device->email,
                'device_id'      => $device->device_id,
                'last_seen_at'   => $device->last_seen_at?->toIso8601String(),
            ],
        ]);
    }
}
