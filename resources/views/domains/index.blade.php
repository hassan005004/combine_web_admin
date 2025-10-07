<x-app-layout>

<div class="max-w-6xl mx-auto py-10 px-5">

    {{-- Header --}}
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Domains</h1>
        <a href="{{ route('domains.create') }}"
           class="inline-flex items-center px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
            + Add New Domain
        </a>
    </div>

    {{-- Flash Message --}}
    @if(session('success'))
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {{ session('success') }}
        </div>
    @endif

    {{-- Domains Table --}}
    <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
        <table class="min-w-full table-auto text-sm">
            <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                <tr>
                    <th class="px-4 py-3 text-left">#</th>
                    <th class="px-4 py-3 text-left">Title</th>
                    <th class="px-4 py-3 text-left">URL</th>
                    <th class="px-4 py-3 text-left">Application ID</th>
                    <th class="px-4 py-3 text-left">Primary Color</th>
                    <th class="px-4 py-3 text-left">Secondary Color</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @forelse($domains as $domain)
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ $loop->iteration }}</td>
                        <td class="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{{ $domain->title }}</td>
                        <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ $domain->url }}</td>
                        <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ $domain->application_id ?? '-' }}</td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center gap-2">
                                <span class="w-4 h-4 rounded-full border" style="background-color: {{ $domain->primary_color }}"></span>
                                <span class="text-xs text-gray-600 dark:text-gray-400">{{ $domain->primary_color }}</span>
                            </span>
                        </td>
                        <td class="px-4 py-3">
                            <span class="inline-flex items-center gap-2">
                                <span class="w-4 h-4 rounded-full border" style="background-color: {{ $domain->secondary_color }}"></span>
                                <span class="text-xs text-gray-600 dark:text-gray-400">{{ $domain->secondary_color }}</span>
                            </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                            <a href="{{ route('domains.edit', $domain->id) }}"
                               class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-blue-500 hover:bg-blue-600 text-white mr-2">
                                Edit
                            </a>
                            <form action="{{ route('domains.destroy', $domain->id) }}" method="POST" class="inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit"
                                    onclick="return confirm('Are you sure you want to delete this domain?')"
                                    class="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-red-500 hover:bg-red-600 text-white">
                                    Delete
                                </button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="7" class="px-4 py-5 text-center text-gray-500 dark:text-gray-400">
                            No domains found.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    {{-- Pagination --}}
    <div class="mt-6">
        {{ $domains->links() }}
    </div>
</div>
</x-app-layout>
