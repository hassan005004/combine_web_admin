<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Domain;
use App\Models\Feedback;
use App\Models\FeatureRequest;
use Illuminate\Http\Request;

class AppEngagementController extends Controller
{
    public function storeFeedback(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'type' => ['required', 'in:feedback,bug'],
            'email' => ['nullable', 'email'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();

        $feedback = Feedback::create([
            'domain_id' => $domain->id,
            'type' => $validated['type'],
            'email' => isset($validated['email']) ? strtolower($validated['email']) : null,
            'subject' => $validated['subject'] ?? null,
            'body' => $validated['body'],
            'status' => 'open',
        ]);

        return response()->json([
            'success' => true,
            'message' => $feedback->type === 'bug' ? 'Bug report submitted.' : 'Feedback submitted.',
            'data' => $feedback,
        ], 201);
    }

    public function storeFeatureRequest(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
            'email' => ['nullable', 'email'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();

        $featureRequest = FeatureRequest::create([
            'domain_id' => $domain->id,
            'email' => isset($validated['email']) ? strtolower($validated['email']) : null,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
            'votes' => 0,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Feature request submitted.',
            'data' => $featureRequest,
        ], 201);
    }

    public function featureRequests(Request $request)
    {
        $validated = $request->validate([
            'application_id' => ['required', 'string'],
        ]);

        $domain = Domain::where('application_id', $validated['application_id'])->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => FeatureRequest::where('domain_id', $domain->id)
                ->latest()
                ->get(['id', 'title', 'description', 'status', 'votes', 'created_at']),
        ]);
    }
}
