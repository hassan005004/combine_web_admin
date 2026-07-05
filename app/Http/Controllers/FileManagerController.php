<?php

namespace App\Http\Controllers;

use App\Models\Domain;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileManagerController extends Controller
{
    // ── Helpers ───────────────────────────────────────────────────────────────

    private function basePath(Domain $domain, string $folder = ''): string
    {
        $base = 'files/' . $domain->id;
        return $folder ? $base . '/' . ltrim($folder, '/') : $base;
    }

    private function normFolder(Request $request): string
    {
        $folder = $request->input('folder', '');
        // Strip any leading slash and prevent directory traversal
        $folder = ltrim(str_replace('..', '', $folder), '/');
        return $folder;
    }

    // ── List files & folders ──────────────────────────────────────────────────

    public function index(Request $request, Domain $domain)
    {
        $folder = $this->normFolder($request);
        $path   = $this->basePath($domain, $folder);

        Storage::disk('public')->makeDirectory($path); // ensure exists

        $dirs  = collect(Storage::disk('public')->directories($path))
            ->map(fn ($d) => [
                'type' => 'folder',
                'name' => basename($d),
                'path' => $folder ? $folder . '/' . basename($d) : basename($d),
            ])
            ->values();

        $files = collect(Storage::disk('public')->files($path))
            ->map(fn ($f) => [
                'type' => 'file',
                'name' => basename($f),
                'path' => $folder ? $folder . '/' . basename($f) : basename($f),
                'url'  => Storage::disk('public')->url($f),
                'size' => Storage::disk('public')->size($f),
            ])
            ->values();

        return response()->json([
            'folder' => $folder,
            'items'  => $dirs->concat($files),
        ]);
    }

    // ── Create folder ─────────────────────────────────────────────────────────

    public function mkdir(Request $request, Domain $domain)
    {
        $request->validate(['name' => ['required', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_\- ]+$/']]);

        $folder = $this->normFolder($request);
        $name   = trim($request->input('name'));
        $path   = $this->basePath($domain, $folder) . '/' . $name;

        Storage::disk('public')->makeDirectory($path);

        return response()->json(['success' => true, 'name' => $name]);
    }

    // ── Upload file ───────────────────────────────────────────────────────────

    public function upload(Request $request, Domain $domain)
    {
        $request->validate([
            'file'   => ['required', 'file', 'max:10240'],  // 10 MB
            'folder' => ['nullable', 'string'],
        ]);

        $folder   = $this->normFolder($request);
        $dir      = $this->basePath($domain, $folder);
        $original = $request->file('file')->getClientOriginalName();
        $safe     = Str::slug(pathinfo($original, PATHINFO_FILENAME)) . '.' . $request->file('file')->getClientOriginalExtension();

        $stored = $request->file('file')->storeAs($dir, $safe, 'public');

        return response()->json([
            'success' => true,
            'file' => [
                'type' => 'file',
                'name' => $safe,
                'path' => $folder ? $folder . '/' . $safe : $safe,
                'url'  => Storage::disk('public')->url($stored),
                'size' => Storage::disk('public')->size($stored),
            ],
        ], 201);
    }

    // ── Delete file or folder ─────────────────────────────────────────────────

    public function destroy(Request $request, Domain $domain)
    {
        $request->validate([
            'path' => ['required', 'string'],
            'type' => ['required', 'in:file,folder'],
        ]);

        $itemPath = $this->basePath($domain) . '/' . ltrim(str_replace('..', '', $request->input('path')), '/');

        if ($request->input('type') === 'folder') {
            Storage::disk('public')->deleteDirectory($itemPath);
        } else {
            Storage::disk('public')->delete($itemPath);
        }

        return response()->json(['success' => true]);
    }
}
