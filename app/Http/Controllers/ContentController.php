<?php

namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    public function index()
    {
        $contents = Content::latest()->paginate(10);
        return view('content.index', compact('contents'));
    }

    public function create()
    {
        return view('content.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'section_id' => 'nullable|string',
            'slug' => 'required|string|unique:content,slug',
            'heading' => 'required|string|max:255',
            'content' => 'nullable|string',
        ]);

        Content::create($validated);
        return redirect()->route('contents.index')->with('success', 'Content created.');
    }

    public function edit(Content $content)
    {
        return view('content.edit', compact('content'));
    }

    public function update(Request $request, Content $content)
    {
        $validated = $request->validate([
            'section_id' => 'nullable|string',
            'slug' => 'required|string|unique:content,slug,' . $content->id,
            'heading' => 'required|string|max:255',
            'content' => 'nullable|string',
        ]);

        $content->update($validated);
        return redirect()->route('contents.index')->with('success', 'Content updated.');
    }

    public function destroy(Content $content)
    {
        $content->delete();
        return redirect()->route('contents.index')->with('success', 'Content deleted.');
    }
}
