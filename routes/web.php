<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AdminApiController;
use App\Http\Controllers\AdminReactController;
use App\Http\Controllers\AppShowcaseController;
use App\Http\Controllers\DataFeedController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::redirect('/', 'login');

Route::get('/apps', AppShowcaseController::class)->name('apps.showcase');

Route::middleware(['auth:sanctum', 'verified'])->group(function () {

    Route::prefix('admin-api')->group(function () {
        Route::get('/dashboard', [AdminApiController::class, 'dashboard']);
        Route::get('/entries', [AdminApiController::class, 'entries']);
        Route::post('/entries', [AdminApiController::class, 'storeEntry']);
        Route::put('/entries/{domain}', [AdminApiController::class, 'updateEntry']);
        Route::delete('/entries/{domain}', [AdminApiController::class, 'destroyEntry']);
        Route::get('/entries/{domain}', [AdminApiController::class, 'entryDetails']);

        Route::post('/memberships', [AdminApiController::class, 'storeMembership']);
        Route::put('/memberships/{membership}', [AdminApiController::class, 'updateMembership']);
        Route::delete('/memberships/{membership}', [AdminApiController::class, 'destroyMembership']);

        Route::post('/membership-plans', [AdminApiController::class, 'storePlan']);
        Route::put('/membership-plans/{plan}', [AdminApiController::class, 'updatePlan']);
        Route::delete('/membership-plans/{plan}', [AdminApiController::class, 'destroyPlan']);

        Route::post('/membership-features', [AdminApiController::class, 'storeFeature']);
        Route::put('/membership-features/{feature}', [AdminApiController::class, 'updateFeature']);
        Route::delete('/membership-features/{feature}', [AdminApiController::class, 'destroyFeature']);

        Route::post('/notifications', [AdminApiController::class, 'storeNotification']);
        Route::post('/notifications/{notification}/resend', [AdminApiController::class, 'resendNotification']);
        Route::delete('/notifications/{notification}', [AdminApiController::class, 'destroyNotification']);

        Route::post('/notification-settings', [AdminApiController::class, 'storeNotificationSetting']);
        Route::delete('/notification-settings/{setting}', [AdminApiController::class, 'destroyNotificationSetting']);

        Route::delete('/devices/{device}', [AdminApiController::class, 'destroyDevice']);
    });

    // Route for the getting the data feed
    Route::get('/json-data-feed', [DataFeedController::class, 'getDataFeed'])->name('json_data_feed');

    Route::get('/utility/404', function () {
        return view('pages/utility/404');
    })->name('404');

    Route::get('/dashboard', AdminReactController::class)->name('dashboard');
    Route::get('/domains/{any?}', AdminReactController::class)->where('any', '.*')->name('domains.index');
    Route::get('/app-memberships/{any?}', AdminReactController::class)->where('any', '.*')->name('app-memberships.index');
    Route::get('/membership-plans/{any?}', AdminReactController::class)->where('any', '.*')->name('membership-plans.index');
    Route::get('/membership-features/{any?}', AdminReactController::class)->where('any', '.*')->name('membership-features.index');
    Route::get('/notifications/{any?}', AdminReactController::class)->where('any', '.*')->name('notifications.index');
    Route::get('/notification-settings/{any?}', AdminReactController::class)->where('any', '.*')->name('notification-settings.index');
    Route::get('/user-devices/{any?}', AdminReactController::class)->where('any', '.*')->name('user-devices.index');

    Route::fallback(AdminReactController::class);    
});
