<aside id="sidebar" class="admin-sidebar">
    <div class="admin-sidebar__brand">
        <a class="admin-sidebar__logo" href="{{ route('dashboard') }}" aria-label="Dashboard">
            <svg class="fill-violet-500" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                <path d="M31.956 14.8C31.372 6.92 25.08.628 17.2.044V5.76a9.04 9.04 0 0 0 9.04 9.04h5.716ZM14.8 26.24v5.716C6.92 31.372.63 25.08.044 17.2H5.76a9.04 9.04 0 0 1 9.04 9.04Zm11.44-9.04h5.716c-.584 7.88-6.876 14.172-14.756 14.756V26.24a9.04 9.04 0 0 1 9.04-9.04ZM.044 14.8C.63 6.92 6.92.628 14.8.044V5.76a9.04 9.04 0 0 1-9.04 9.04H.044Z" />
            </svg>
            <span class="admin-sidebar__title">Admin Panel</span>
        </a>
    </div>

    @php
        $links = [
            ['segment' => 'dashboard', 'name' => 'Dashboard', 'route' => route('dashboard')],
            ['segment' => 'domains', 'name' => 'Entries', 'route' => route('domains.index')],
        ];
    @endphp

    <nav class="admin-sidebar__nav" aria-label="Admin navigation">
        <div class="admin-sidebar__section">Admin</div>
        @foreach($links as $link)
            @php($active = in_array(Request::segment(1), [$link['segment']]))
            <a class="admin-sidebar__link {{ $active ? 'admin-sidebar__link--active' : '' }}" href="{{ $link['route'] }}">
                <svg class="admin-sidebar__icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path d="M2 2h5v5H2V2Zm7 0h5v5H9V2ZM2 9h5v5H2V9Zm7 0h5v5H9V9Z" />
                </svg>
                <span class="admin-sidebar__text">{{ $link['name'] }}</span>
            </a>
        @endforeach
    </nav>
</aside>
