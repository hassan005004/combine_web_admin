<x-app-layout>
<div class="max-w-4xl mx-auto py-10">

    <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {{ isset($notification) ? 'Edit Notification' : 'Send New Notification' }}
    </h1>

    @if(session('success'))
        <div class="mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
            {{ session('success') }}
        </div>
    @endif

    @if ($errors->any())
        <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            <ul class="list-disc pl-5">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        </div>
    @endif

    <form method="POST"
          action="{{ isset($notification) ? route('notifications.update', $notification->id) : route('notifications.store') }}">
        @csrf
        @if(isset($notification))
            @method('PUT')
        @endif

        <div class="grid grid-cols-1 gap-5">

            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Title</label>
                <input type="text" name="title" value="{{ old('title', $notification->title ?? '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700" required>
            </div>

            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Message</label>
                <textarea name="message" rows="5"
                          class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                          required>{{ old('message', $notification->message ?? '') }}</textarea>
            </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
            <a href="{{ route('notifications.index') }}"
               class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100">
                Cancel
            </a>

            <button type="submit"
                    class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white">
                {{ isset($notification) ? 'Update & Resend' : 'Send Notification' }}
            </button>
        </div>
    </form>
</div>
</x-app-layout>
