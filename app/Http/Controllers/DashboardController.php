<?php

namespace App\Http\Controllers;

use App\Models\AppMembership;
use App\Models\Domain;
use App\Models\MembershipPlan;
use App\Models\UserDevice;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'entries' => Domain::count(),
            'apps' => Domain::whereIn('entry_type', ['app', 'both'])->count(),
            'websites' => Domain::whereIn('entry_type', ['website', 'both'])->count(),
            'users' => UserDevice::count(),
            'logged_in_users' => UserDevice::whereNotNull('email')->distinct('email')->count('email'),
            'guest_users' => UserDevice::whereNull('email')->count(),
            'active_users' => UserDevice::where('last_seen_at', '>=', now()->subMinutes(30))->count(),
            'active_today' => UserDevice::whereDate('last_seen_at', today())->count(),
            'active_7_days' => UserDevice::where('last_seen_at', '>=', now()->subDays(7))->count(),
            'active_30_days' => UserDevice::where('last_seen_at', '>=', now()->subDays(30))->count(),
            'memberships' => AppMembership::where('is_active', true)
                ->where(function ($query) {
                    $query->whereNull('expires_at')->orWhere('expires_at', '>', now());
                })
                ->count(),
            'membership_plans' => MembershipPlan::where('is_active', true)->count(),
        ];

        $recentDevices = UserDevice::with('domain')
            ->latest('last_seen_at')
            ->limit(10)
            ->get();

        return view('pages.dashboard.dashboard', compact('stats', 'recentDevices'));
    }

    /**
     * Displays the analytics screen
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\Contracts\View\View
     */
    public function analytics()
    {
        return view('pages/dashboard/analytics');
    }

    /**
     * Displays the fintech screen
     *
     * @return \Illuminate\Contracts\View\Factory|\Illuminate\Contracts\View\View
     */
    public function fintech()
    {
        return view('pages/dashboard/fintech');
    }
}
