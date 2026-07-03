<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AppConfigController;
use App\Http\Controllers\Api\FcmTokenController;

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
Route::post('/fcm-token', [FcmTokenController::class, 'store']);
Route::post('/user-active', [FcmTokenController::class, 'touch']);
