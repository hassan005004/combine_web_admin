<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\Domain;

class SetActiveDomain
{
    public function handle(Request $request, Closure $next)
    {
        // From header, session, or authenticated user
        $domainId = $request->header('X-Domain-ID') ?? session('active_domain_id');

        if ($domainId) {
            $domain = Domain::find($domainId);
            if ($domain) {
                app()->instance('activeDomain', $domain);
            }
        }else{
            $domain = Domain::first();
            app()->instance('activeDomain', $domain);
        }

        return $next($request);
    }
}
