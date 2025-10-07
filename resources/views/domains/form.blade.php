<x-app-layout>
<div class="max-w-4xl mx-auto py-10">

    {{-- Title --}}
    <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {{ isset($domain) ? 'Edit Domain' : 'Add New Domain' }}
    </h1>

    {{-- Success Message --}}
    @if(session('success'))
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {{ session('success') }}
        </div>
    @endif

    {{-- Error Messages --}}
    @if ($errors->any())
        <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            <ul class="list-disc pl-5">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    {{-- Domain Form --}}
    <form method="POST" 
          action="{{ isset($domain) ? route('domains.update', $domain->id) : route('domains.store') }}">
        @csrf
        @if(isset($domain))
            @method('PUT')
        @endif

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

            {{-- Title --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Title</label>
                <input type="text" name="title" value="{{ old('title', $domain->title ?? '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required>
            </div>

            {{-- URL --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">URL</label>
                <input type="text" name="url" value="{{ old('url', $domain->url ?? '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" >
            </div>

            {{-- Application ID --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Application ID</label>
                <input type="text" name="application_id" value="{{ old('application_id', $domain->application_id ?? '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
            </div>

            {{-- SEO Title --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">SEO Title</label>
                <input type="text" name="seo_title" value="{{ old('seo_title', $domain->seo_title ?? '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
            </div>

            {{-- SEO Description --}}
            <div class="md:col-span-2">
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">SEO Description</label>
                <textarea name="seo_description"
                          class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                          rows="2">{{ old('seo_description', $domain->seo_description ?? '') }}</textarea>
            </div>

            {{-- SEO Keywords --}}
            <div class="md:col-span-2">
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">SEO Keywords</label>
                <input type="text" name="seo_keywords" value="{{ old('seo_keywords', $domain->seo_keywords ?? '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
            </div>

            {{-- Colors --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Primary Color</label>
                <input type="color" name="primary_color" value="{{ old('primary_color', $domain->primary_color ?? '#000000') }}"
                       class="w-full p-2 border rounded-lg cursor-pointer">
            </div>

            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Secondary Color</label>
                <input type="color" name="secondary_color" value="{{ old('secondary_color', $domain->secondary_color ?? '#ffffff') }}"
                       class="w-full p-2 border rounded-lg cursor-pointer">
            </div>
        </div>

        {{-- Save Button --}}
        <div class="mt-6 flex justify-end gap-3">
            <a href="{{ route('domains.index') }}"
               class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100">
                Cancel
            </a>

            <button type="submit"
                    class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white">
                {{ isset($domain) ? 'Update' : 'Create' }}
            </button>
        </div>
    </form>

    {{-- Delete Button (only for edit mode) --}}
    @if(isset($domain))
        <form method="POST" action="{{ route('domains.destroy', $domain->id) }}" class="mt-6">
            @csrf
            @method('DELETE')
            <button type="submit"
                    onclick="return confirm('Are you sure you want to delete this domain?')"
                    class="text-red-600 hover:text-red-800 font-semibold">
                Delete Domain
            </button>
        </form>
    @endif
</div>
</x-app-layout>
