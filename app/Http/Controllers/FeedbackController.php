<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use App\Models\Feedback;
use App\Models\FeatureRequest;
use App\Models\Faq;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    // ── FAQs ──────────────────────────────────────────────────────────────────

    public function faqs(Domain $domain)
    {
        return response()->json(['faqs' => Faq::where('domain_id', $domain->id)->orderBy('sorting')->get()]);
    }

    public function storeFaq(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:500'],
            'answer'   => ['required', 'string'],
            'sorting'  => ['nullable', 'integer', 'min:0'],
        ]);
        $data['domain_id'] = $domain->id;
        $data['slug'] = \Illuminate\Support\Str::slug(substr($data['question'], 0, 60)) . '-' . uniqid();

        return response()->json(['faq' => Faq::create($data)], 201);
    }

    public function updateFaq(Request $request, Domain $domain, Faq $faq)
    {
        $data = $request->validate([
            'question' => ['required', 'string', 'max:500'],
            'answer'   => ['required', 'string'],
            'sorting'  => ['nullable', 'integer', 'min:0'],
        ]);
        $faq->update($data);

        return response()->json(['faq' => $faq->fresh()]);
    }

    public function destroyFaq(Domain $domain, Faq $faq)
    {
        $faq->delete();

        return response()->json(['success' => true]);
    }

    // ── Feedback / Bug Reports ────────────────────────────────────────────────

    public function feedbacks(Domain $domain)
    {
        return response()->json(['feedbacks' => Feedback::where('domain_id', $domain->id)->latest()->get()]);
    }

    public function storeFeedback(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'type'    => ['required', 'in:feedback,bug'],
            'email'   => ['nullable', 'email'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body'    => ['required', 'string'],
            'status'  => ['nullable', 'in:open,in_progress,resolved,closed'],
        ]);
        $data['domain_id'] = $domain->id;

        return response()->json(['feedback' => Feedback::create($data)], 201);
    }

    public function updateFeedback(Request $request, Domain $domain, Feedback $feedback)
    {
        $data = $request->validate([
            'status'      => ['required', 'in:open,in_progress,resolved,closed'],
            'admin_notes' => ['nullable', 'string'],
        ]);
        $feedback->update($data);

        return response()->json(['feedback' => $feedback->fresh()]);
    }

    public function destroyFeedback(Domain $domain, Feedback $feedback)
    {
        $feedback->delete();

        return response()->json(['success' => true]);
    }

    // ── Feature Requests ──────────────────────────────────────────────────────

    public function featureRequests(Domain $domain)
    {
        return response()->json(['requests' => FeatureRequest::where('domain_id', $domain->id)->latest()->get()]);
    }

    public function storeFeatureRequest(Request $request, Domain $domain)
    {
        $data = $request->validate([
            'title'       => ['required', 'string', 'max:255'],
            'email'       => ['nullable', 'email'],
            'description' => ['nullable', 'string'],
            'status'      => ['nullable', 'in:pending,under_review,planned,in_progress,completed,rejected'],
        ]);
        $data['domain_id'] = $domain->id;

        return response()->json(['request' => FeatureRequest::create($data)], 201);
    }

    public function updateFeatureRequest(Request $request, Domain $domain, FeatureRequest $featureRequest)
    {
        $data = $request->validate([
            'status'      => ['required', 'in:pending,under_review,planned,in_progress,completed,rejected'],
            'admin_notes' => ['nullable', 'string'],
        ]);
        $featureRequest->update($data);

        return response()->json(['request' => $featureRequest->fresh()]);
    }

    public function destroyFeatureRequest(Domain $domain, FeatureRequest $featureRequest)
    {
        $featureRequest->delete();

        return response()->json(['success' => true]);
    }
}
