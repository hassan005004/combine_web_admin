<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.js'])

        <!-- Styles -->
        @livewireStyles        

        <script>
            if (localStorage.getItem('dark-mode') === 'false' || !('dark-mode' in localStorage)) {
                document.querySelector('html').classList.remove('dark');
                document.querySelector('html').style.colorScheme = 'light';
            } else {
                document.querySelector('html').classList.add('dark');
                document.querySelector('html').style.colorScheme = 'dark';
            }
        </script>
        <style>
            #sidebar.admin-sidebar {
                width: 16rem !important;
                min-width: 16rem !important;
                max-width: 16rem !important;
                transform: none !important;
            }
            #sidebar .admin-sidebar__text,
            #sidebar .admin-sidebar__title {
                display: inline !important;
                opacity: 1 !important;
                visibility: visible !important;
            }
        </style>
    </head>
    <body
        class="font-inter antialiased bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400"
        x-data="{ sidebarOpen: false }"
    >

        <!-- Page wrapper -->
        <div class="flex h-[100dvh] overflow-hidden">

            <x-app.sidebar :variant="@$attributes['sidebarVariant']" />

            <!-- Content area -->
            <div class="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden @if(@$attributes['background']){{ @$attributes['background'] }}@endif" x-ref="contentarea">

                <x-app.header :variant="@$attributes['headerVariant']" />

                <main class="grow">
                    {{ $slot }}
                </main>

            </div>

        </div>

        @livewireScriptConfig
    </body>
</html>
