<x-app-layout>
<div class="max-w-4xl mx-auto py-10">

    {{-- Title --}}
    <h1 class="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">
        {{ isset($notification) ? 'Edit Notification' : 'Add New Notification' }}
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

    {{-- Notification Form --}}
    <form method="POST" 
          action="{{ isset($notification) ? route('notification-settings.update', $notification->id) : route('notification-settings.store') }}"
          enctype="multipart/form-data">
        @csrf
        @if(isset($notification))
            @method('PUT')
        @endif

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">

            {{-- Services File --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Services File</label>
                <input type="file" name="services_file"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                       {{ isset($notification) ? '' : 'required' }}>
                @if(isset($notification) && $notification->services_file)
                    <p class="text-sm text-gray-500 mt-1">Current: {{ $notification->services_file }}</p>
                @endif
            </div>

            {{-- Token --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Token</label>
                <input type="text" name="token" value="{{ old('token', $notification->token ?? '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
            </div>

            {{-- Token Expiry --}}
            <div>
                <label class="block text-gray-700 dark:text-gray-300 font-semibold mb-2">Token Expiry</label>
                <input type="datetime-local" name="token_expiry"
                       value="{{ old('token_expiry', isset($notification->token_expiry) ? $notification->token_expiry->format('Y-m-d\TH:i') : '') }}"
                       class="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700">
            </div>
        </div>

        {{-- Save Button --}}
        <div class="mt-6 flex justify-end gap-3">
            <a href="{{ route('notification-settings.index') }}"
               class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-100">
                Cancel
            </a>

            <button type="submit"
                    class="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white">
                {{ isset($notification) ? 'Update' : 'Create' }}
            </button>
        </div>
    </form>

    {{-- Delete Button --}}
    @if(isset($notification))
        <form method="POST" action="{{ route('notification-settings.destroy', $notification->id) }}" class="mt-6">
            @csrf
            @method('DELETE')
            <button type="submit"
                    onclick="return confirm('Are you sure you want to delete this notification?')"
                    class="text-red-600 hover:text-red-800 font-semibold">
                Delete Notification
            </button>
        </form>
    @endif

</div>
</x-app-layout>
