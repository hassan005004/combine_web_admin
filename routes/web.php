<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AdminApiController;
use App\Http\Controllers\AdminReactController;
use App\Http\Controllers\AppShowcaseController;
use App\Http\Controllers\DataFeedController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\FileManagerController;
use App\Http\Controllers\MarketingController;
use App\Http\Controllers\PublicAppPageController;
use App\Http\Controllers\RoleController;

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
Route::get('/{applicationId}/{page}', [PublicAppPageController::class, 'show'])
    ->where([
        'applicationId' => '[A-Za-z0-9_.]+',
        'page' => 'about-us|privacy-policy|terms-and-conditions|support-policy|delete-policy',
    ])
    ->name('app-pages.pretty');
Route::get('/app-pages/{applicationId}/{page}', [PublicAppPageController::class, 'show'])
    ->name('app-pages.show');

Route::middleware(['auth:sanctum', 'verified'])->group(function () {

    Route::prefix('admin-api')->group(function () {
        Route::get('/dashboard', [AdminApiController::class, 'dashboard']);
        Route::get('/entries', [AdminApiController::class, 'entries']);
        Route::post('/entries', [AdminApiController::class, 'storeEntry']);
        Route::post('/entries/reorder', [AdminApiController::class, 'reorderEntries']);
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
        Route::post('/entries/{domain}/smtp-setting', [AdminApiController::class, 'storeSmtpSetting']);
        Route::post('/entries/{domain}/smtp-setting/test', [AdminApiController::class, 'testSmtpSetting']);

        Route::delete('/devices/{device}', [AdminApiController::class, 'destroyDevice']);

        // Membership cancel + promo
        Route::post('/memberships/{membership}/cancel', [AdminApiController::class, 'cancelMembership']);
        Route::post('/memberships/{membership}/promo',  [AdminApiController::class, 'applyPromo']);

        // FAQs
        Route::get('/entries/{domain}/faqs',              [FeedbackController::class, 'faqs']);
        Route::post('/entries/{domain}/faqs',             [FeedbackController::class, 'storeFaq']);
        Route::put('/entries/{domain}/faqs/{faq}',        [FeedbackController::class, 'updateFaq']);
        Route::delete('/entries/{domain}/faqs/{faq}',     [FeedbackController::class, 'destroyFaq']);

        // Feedback / Bug Reports
        Route::get('/entries/{domain}/feedbacks',                   [FeedbackController::class, 'feedbacks']);
        Route::post('/entries/{domain}/feedbacks',                  [FeedbackController::class, 'storeFeedback']);
        Route::put('/entries/{domain}/feedbacks/{feedback}',        [FeedbackController::class, 'updateFeedback']);
        Route::delete('/entries/{domain}/feedbacks/{feedback}',     [FeedbackController::class, 'destroyFeedback']);

        // Feature Requests
        Route::get('/entries/{domain}/feature-requests',                          [FeedbackController::class, 'featureRequests']);
        Route::post('/entries/{domain}/feature-requests',                         [FeedbackController::class, 'storeFeatureRequest']);
        Route::put('/entries/{domain}/feature-requests/{featureRequest}',         [FeedbackController::class, 'updateFeatureRequest']);
        Route::delete('/entries/{domain}/feature-requests/{featureRequest}',      [FeedbackController::class, 'destroyFeatureRequest']);

        // Marketing
        Route::get('/entries/{domain}/marketing',                                          [MarketingController::class, 'overview']);
        Route::post('/entries/{domain}/campaigns',                                         [MarketingController::class, 'storeCampaign']);
        Route::put('/entries/{domain}/campaigns/{campaign}',                               [MarketingController::class, 'updateCampaign']);
        Route::delete('/entries/{domain}/campaigns/{campaign}',                            [MarketingController::class, 'destroyCampaign']);
        Route::post('/entries/{domain}/referrals',                                         [MarketingController::class, 'storeReferral']);
        Route::put('/entries/{domain}/referrals/{program}',                                [MarketingController::class, 'updateReferral']);
        Route::delete('/entries/{domain}/referrals/{program}',                             [MarketingController::class, 'destroyReferral']);
        Route::post('/entries/{domain}/affiliates',                                        [MarketingController::class, 'storeAffiliate']);
        Route::put('/entries/{domain}/affiliates/{affiliate}',                             [MarketingController::class, 'updateAffiliate']);
        Route::delete('/entries/{domain}/affiliates/{affiliate}',                          [MarketingController::class, 'destroyAffiliate']);
        Route::post('/entries/{domain}/affiliates/{affiliate}/conversions',                [MarketingController::class, 'storeConversion']);
        Route::put('/entries/{domain}/affiliates/{affiliate}/conversions/{conversion}',    [MarketingController::class, 'updateConversion']);
        Route::post('/entries/{domain}/landing-pages',                                     [MarketingController::class, 'storeLandingPage']);
        Route::put('/entries/{domain}/landing-pages/{landingPage}',                        [MarketingController::class, 'updateLandingPage']);
        Route::delete('/entries/{domain}/landing-pages/{landingPage}',                     [MarketingController::class, 'destroyLandingPage']);
        Route::post('/entries/{domain}/revenue',                                           [MarketingController::class, 'storeRevenue']);
        Route::put('/entries/{domain}/revenue/{revenueEntry}',                             [MarketingController::class, 'updateRevenue']);
        Route::delete('/entries/{domain}/revenue/{revenueEntry}',                          [MarketingController::class, 'destroyRevenue']);
        Route::post('/entries/{domain}/expenses',                                          [MarketingController::class, 'storeExpense']);
        Route::put('/entries/{domain}/expenses/{expense}',                                 [MarketingController::class, 'updateExpense']);
        Route::delete('/entries/{domain}/expenses/{expense}',                              [MarketingController::class, 'destroyExpense']);

        // File Manager (scoped per domain)
        Route::get('/entries/{domain}/files',        [FileManagerController::class, 'index']);
        Route::post('/entries/{domain}/files/mkdir', [FileManagerController::class, 'mkdir']);
        Route::post('/entries/{domain}/files/upload',[FileManagerController::class, 'upload']);
        Route::delete('/entries/{domain}/files',     [FileManagerController::class, 'destroy']);

        Route::post('/settings/profile', [AdminApiController::class, 'updateProfile']);
        Route::post('/settings/email', [AdminApiController::class, 'updateEmail']);
        Route::post('/settings/password', [AdminApiController::class, 'updatePassword']);

        Route::get('/staff-users', [AdminApiController::class, 'staffUsers']);
        Route::post('/staff-users', [AdminApiController::class, 'storeStaffUser']);
        Route::put('/staff-users/{user}', [AdminApiController::class, 'updateStaffUser']);
        Route::delete('/staff-users/{user}', [AdminApiController::class, 'destroyStaffUser']);

        // Roles & Permissions
        Route::get('/roles',                   [RoleController::class, 'index']);
        Route::post('/roles',                  [RoleController::class, 'store']);
        Route::put('/roles/{role}',            [RoleController::class, 'update']);
        Route::delete('/roles/{role}',         [RoleController::class, 'destroy']);
        Route::post('/roles/assign-user',      [RoleController::class, 'assignUser']);

        Route::get('/entries/{domain}/pages', [AdminApiController::class, 'listPages']);
        Route::post('/entries/{domain}/pages', [AdminApiController::class, 'storePage']);
        Route::put('/entries/{domain}/pages/{page}', [AdminApiController::class, 'updatePage']);
        Route::delete('/entries/{domain}/pages/{page}', [AdminApiController::class, 'destroyPage']);

        Route::post('/entries/{domain}/notes', [AdminApiController::class, 'storeNote']);
        Route::put('/entries/{domain}/notes/{note}', [AdminApiController::class, 'updateNote']);
        Route::delete('/entries/{domain}/notes/{note}', [AdminApiController::class, 'destroyNote']);
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
    Route::get('/settings', AdminReactController::class)->name('settings');
    Route::get('/account/profile', AdminReactController::class)->name('account.profile');
    Route::get('/account/password', AdminReactController::class)->name('account.password');
    Route::get('/staff-users', AdminReactController::class)->name('staff-users.index');
    Route::get('/pages/{any?}', AdminReactController::class)->where('any', '.*')->name('pages.index');

    Route::fallback(AdminReactController::class);    
});
