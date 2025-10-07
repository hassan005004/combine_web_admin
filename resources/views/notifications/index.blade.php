<x-app-layout>
<div class="max-w-6xl mx-auto py-10 px-5">

    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Notifications</h1>
        <a href="{{ route('notifications.create') }}"
           class="inline-flex items-center px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium">
            + Send New Notification
        </a>
    </div>

    @if(session('success'))
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {{ session('success') }}
        </div>
    @endif

    <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg">
        <table class="min-w-full table-auto text-sm">
            <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                <tr>
                    <th class="px-4 py-3 text-left">#</th>
                    <th class="px-4 py-3 text-left">Title</th>
                    <th class="px-4 py-3 text-left">Message</th>
                    <th class="px-4 py-3 text-left">Response</th>
                    <th class="px-4 py-3 text-left">Sent At</th>
                    <th class="px-4 py-3 text-right">Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse($notifications as $index => $notification)
                    <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td class="px-4 py-3">{{ $index + 1 }}</td>
                        <td class="px-4 py-3">{{ $notification->title }}</td>
                        <td class="px-4 py-3">{{ Str::limit($notification->message, 60) }}</td>
                        <td>
                            Total: {{ $notification->logs->count() }} <br>
                            Success: {{ $notification->logs->where('success', true)->count() }} <br>
                            Failed: {{ $notification->logs->where('success', false)->count() }}
                            <p class="text-blue-700 dark:text-blue-300">{{ $notification->logs->last()->response ?? 'No logs yet' }}</p>
                        </td>
                        <td class="px-4 py-3">
                            {{ $notification->sent_at ? $notification->sent_at->format('Y-m-d H:i') : '—' }}
                        </td>
                        <td class="px-4 py-3 text-right">
                            <div class="flex justify-end gap-2">
                                <a href="{{ route('notifications.show', $notification->id) }}"
                                   class="text-green-600 hover:text-green-800 font-semibold">Show</a>

                                <a href="{{ route('notifications.edit', $notification->id) }}"
                                   class="text-violet-600 hover:text-violet-800 font-semibold">Edit</a>

                                <form method="POST" action="{{ route('notifications.resend', $notification->id) }}">
                                    @csrf
                                    <button type="submit"
                                            class="text-blue-600 hover:text-blue-800 font-semibold">
                                        Resend
                                    </button>
                                </form>

                                <form method="POST" action="{{ route('notifications.destroy', $notification->id) }}">
                                    @csrf
                                    @method('DELETE')
                                    <button type="submit"
                                            onclick="return confirm('Are you sure?')"
                                            class="text-red-600 hover:text-red-800 font-semibold">
                                        Delete
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="px-4 py-3 text-center text-gray-500 dark:text-gray-400">
                            No notifications yet.
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

</div>
</x-app-layout>
