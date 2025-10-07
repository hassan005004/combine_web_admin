<x-app-layout>
<div class="max-w-6xl mx-auto py-10 px-5">

    <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Notification Details</h1>
        <a href="{{ route('notifications.index') }}"
           class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100">
           Back
        </a>
    </div>

    {{-- Notification Summary --}}
    <div class="mb-6 p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
        <p><strong>Title:</strong> {{ $notification->title }}</p>
        <p><strong>Message:</strong> {{ $notification->message }}</p>
        <p><strong>Sent At:</strong> {{ $notification->sent_at ? $notification->sent_at->format('Y-m-d H:i') : '—' }}</p>
        <p><strong>Total Users:</strong> {{ $notification->logs->count() }}</p>
        <p><strong>Delivered:</strong> {{ $notification->logs->where('success', true)->count() }}</p>
        <p><strong>Failed:</strong> {{ $notification->logs->where('success', false)->count() }}</p>
    </div>

    {{-- Last Message --}}
    <div class="mb-6 p-4 bg-white dark:bg-gray-800 shadow rounded-lg">
        <p><strong>Last Message Sent:</strong></p>
        <p class="text-gray-700 dark:text-gray-300">{{ $notification->logs->last()->response ?? 'No logs yet' }}</p>
    </div>

    {{-- Failed Logs --}}
    <div class="overflow-x-auto bg-white dark:bg-gray-800 shadow rounded-lg p-4">
        <h2 class="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Failed Notifications</h2>

        @if($notification->logs->where('success', false)->isEmpty())
            <p class="text-gray-500 dark:text-gray-400">No failed notifications.</p>
        @else
            <table class="min-w-full table-auto text-sm">
                <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase text-xs font-semibold">
                    <tr>
                        <th class="px-4 py-3 text-left">#</th>
                        <th class="px-4 py-3 text-left">User ID</th>
                        <th class="px-4 py-3 text-left">FCM Token</th>
                        <th class="px-4 py-3 text-left">Error Reason</th>
                        <th class="px-4 py-3 text-left">Time</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($notification->logs->where('success', false)->sortByDesc('created_at') as $index => $log)
                        <tr class="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td class="px-4 py-3">{{ $index + 1 }}</td>
                            <td class="px-4 py-3">{{ $log->user_id ?? 'N/A' }}</td>
                            <td class="px-4 py-3 break-all">{{ $log->fcm_token }}</td>
                            <td class="px-4 py-3">{{ $log->response ?? 'Unknown' }}</td>
                            <td class="px-4 py-3">{{ $log->created_at->format('Y-m-d H:i') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif
    </div>
</div>
</x-app-layout>
