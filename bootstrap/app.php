<?php

use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind Vercel's proxy PHP sees plain HTTP. Trust its X-Forwarded-* headers so
        // generated URLs (Vite assets, redirects) use https:// instead of being blocked
        // as mixed content, which left the page blank. Only the platform proxy can reach PHP.
        $middleware->trustProxies(at: '*');

        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // The real login page is the landing page at /, not Breeze's /login.
        $middleware->redirectGuestsTo(fn () => route('home'));

        $middleware->alias(['admin' => EnsureAdmin::class]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Themed error pages instead of Laravel's plain ones. 5xx keep the debug page while APP_DEBUG is on.
        $exceptions->respond(function (Response $response, Throwable $e, Request $request) {
            $status = $response->getStatusCode();
            if ($request->is('api/*') || $request->expectsJson()) {
                return $response;
            }
            if ($status === 419) {
                return back()->with('info', 'Your session expired. Please try again.');
            }
            if (! in_array($status, [403, 404, 429, 500, 503], true) || ($status >= 500 && config('app.debug'))) {
                return $response;
            }

            try {
                return Inertia::render('Error', ['status' => $status])->toResponse($request)->setStatusCode($status);
            } catch (Throwable $renderFailure) {
                // Never let the error page itself turn a 403/404 into a 500.
                report($renderFailure);

                return $response;
            }
        });
    })->create();
