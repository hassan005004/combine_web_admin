<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use Illuminate\Http\Request;

class FaqController extends Controller
{
    public function index()
    {
        $domain = app('activeDomain');
        $faqs = Faq::where('domain_id', $domain->id)->orderBy('sorting')->paginate(20);
        return view('faqs.index', compact('faqs', 'domain'));
    }

    public function create()
    {
        $domain = app('activeDomain');
        return view('faqs.create', compact('domain'));
    }

    public function store(Request $request)
    {
        $domain = app('activeDomain');
        $validated = $request->validate([
            'slug' => 'required|string|unique:faqs,slug',
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'sorting' => 'nullable|integer',
        ]);
        $validated['domain_id'] = $domain->id;
        Faq::create($validated);

        return redirect()->route('faqs.index')->with('success', 'FAQ added.');
    }

    public function edit(Faq $faq)
    {
        $domain = app('activeDomain');
        abort_unless($faq->domain_id === $domain->id, 403);
        return view('faqs.edit', compact('faq', 'domain'));
    }

    public function update(Request $request, Faq $faq)
    {
        $domain = app('activeDomain');
        abort_unless($faq->domain_id === $domain->id, 403);

        $validated = $request->validate([
            'slug' => 'required|string|unique:faqs,slug,' . $faq->id,
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'sorting' => 'nullable|integer',
        ]);

        $faq->update($validated);

        return redirect()->route('faqs.index')->with('success', 'FAQ updated.');
    }

    public function destroy(Faq $faq)
    {
        $domain = app('activeDomain');
        abort_unless($faq->domain_id === $domain->id, 403);

        $faq->delete();
        return redirect()->route('faqs.index')->with('success', 'FAQ deleted.');
    }
}
