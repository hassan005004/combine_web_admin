<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Forces all API requests to be treated as expecting JSON.
 * This prevents Laravel from redirecting to /login on auth failures
 * and ensures validation errors return 422 JSON instead of a redirect.
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
