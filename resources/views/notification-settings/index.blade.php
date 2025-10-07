<x-app-layout>
<div class="max-w-6xl mx-auto py-10 px-5">

    {{-- Header --}}
    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Notification Settings</h1>
        <a href="{{ route('notification-settings.create') }}"
           class="inline-flex items-center px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
            + Add New Notification
        </a>
    </div>

    {{-- Flash Message --}}
    @if(session('success'))
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {{ session('success') }}
        </div>
    @endif

    {{-- Notifications Table --}}
    <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
        <table class="min-w-full table-auto text-sm">
            <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                <tr>
                    <th class="px-4 py-3 text-left">#</th>
                    <th class="px-4 py-3 text-left">Domain</th>
                    <th class="px-4 py-3 text-left">Services File</th>
                    <th class="px-4 py-3 text-left">Token</th>
                    <th class="px-4 py-3 text-left">Token Expiry</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody class="text-gray-700 dark:text-gray-300">
                @forelse($notificationSettings as $index => $notification)
                    <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td class="px-4 py-3">{{ $index + 1 }}</td>
                        <td class="px-4 py-3">{{ $notification->domain->title ?? 'N/A' }}</td>
                        <td class="px-4 py-3">{{ $notification->services_file }}</td>
                        <td class="px-4 py-3">{{ $notification->token ?? '—' }}</td>
                        <td class="px-4 py-3">
                            {{ $notification->token_expiry ? $notification->token_expiry->format('Y-m-d H:i') : '—' }}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <a href="{{ route('notification-settings.edit', $notification->id) }}"
                               class="text-violet-600 hover:text-violet-800 font-semibold mr-3">Edit</a>
                            <form action="{{ route('notification-settings.destroy', $notification->id) }}" method="POST" class="inline">
                                @csrf
                                @method('DELETE')
                                <button type="submit"
                                        onclick="return confirm('Are you sure you want to delete this notification?')"
                                        class="text-red-600 hover:text-red-800 font-semibold">
                                    Delete
                                </button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                            No notifications found.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

</div>
</x-app-layout>
