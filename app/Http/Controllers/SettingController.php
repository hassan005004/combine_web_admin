<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index()
    {
        $settings = Setting::latest()->paginate(15);
        return view('settings.index', compact('settings'));
    }

    public function create()
    {
        return view('settings.create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:settings,key',
            'value' => 'nullable|string',
        ]);

        Setting::create($validated);
        return redirect()->route('settings.index')->with('success', 'Setting saved.');
    }

    public function edit(Setting $setting)
    {
        return view('settings.edit', compact('setting'));
    }

    public function update(Request $request, Setting $setting)
    {
        $validated = $request->validate([
            'key' => 'required|string|unique:settings,key,' . $setting->id,
            'value' => 'nullable|string',
        ]);

        $setting->update($validated);
        return redirect()->route('settings.index')->with('success', 'Setting updated.');
    }

    public function destroy(Setting $setting)
    {
        $setting->delete();
        return redirect()->route('settings.index')->with('success', 'Setting deleted.');
    }
}
