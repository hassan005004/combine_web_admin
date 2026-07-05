<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AppConfigController;
use App\Http\Controllers\Api\AppEngagementController;
use App\Http\Controllers\Api\FcmTokenController;
use App\Http\Controllers\Api\MembershipCancellationController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/app-config', [AppConfigController::class, 'show']);
Route::post('/app-config', [AppConfigController::class, 'show']);
Route::post('/membership-trial', [AppConfigController::class, 'startTrial']);
Route::post('/fcm-token', [FcmTokenController::class, 'store']);
Route::post('/user-active', [FcmTokenController::class, 'touch']);
Route::post('/membership-cancel', [MembershipCancellationController::class, 'store']);
Route::post('/feedback', [AppEngagementController::class, 'storeFeedback']);
Route::post('/feature-request', [AppEngagementController::class, 'storeFeatureRequest']);
Route::get('/feature-requests', [AppEngagementController::class, 'featureRequests']);
