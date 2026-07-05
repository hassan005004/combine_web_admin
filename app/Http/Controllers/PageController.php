<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\Request;

class PageController extends Controller
{
    public function index()
    {
        $domain = app('activeDomain');
        $pages = Page::where('domain_id', $domain->id)->latest()->paginate(10);

        return view('pages.index', compact('pages', 'domain'));
    }

    public function create()
    {
        $domain = app('activeDomain');
        return view('pages.create', compact('domain'));
    }

    public function store(Request $request)
    {
        $domain = app('activeDomain');

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|unique:pages,slug',
            'description' => 'nullable|string',
            'status' => 'required|in:draft,published',
        ]);

        $validated['domain_id'] = $domain->id;
        Page::create($validated);

        return redirect()->route('pages.index')->with('success', 'Page created successfully.');
    }

    public function edit(Page $page)
    {
        $domain = app('activeDomain');

        if ($page->domain_id !== $domain->id) {
            abort(403, 'Unauthorized access to this domain’s data');
        }

        return view('pages.edit', compact('page', 'domain'));
    }

    public function update(Request $request, Page $page)
    {
        $domain = app('activeDomain');

        if ($page->domain_id !== $domain->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|unique:pages,slug,' . $page->id,
            'description' => 'nullable|string',
            'status' => 'required|in:draft,published',
        ]);

        $page->update($validated);

        return redirect()->route('pages.index')->with('success', 'Page updated successfully.');
    }

    public function destroy(Page $page)
    {
        $domain = app('activeDomain');

        if ($page->domain_id !== $domain->id) {
            abort(403);
        }

        $page->delete();

        return redirect()->route('pages.index')->with('success', 'Page deleted successfully.');
    }
}
