<?php

namespace App\Http\Controllers;

use App\Models\Domain;

class AppShowcaseController extends Controller
{
    public function __invoke()
    {
        $apps = Domain::query()
            ->whereIn('entry_type', ['app', 'both'])
            ->where('show_in_apps_gallery', true)
            ->orderBy('title')
            ->get()
            ->map(function (Domain $app) {
                $googlePlayUrl = $app->google_play_url ?: 'https://play.google.com/store/apps/details?id='.$app->application_id;

                return [
                    'title' => $app->title,
                    'application_id' => $app->application_id,
                    'description' => $app->seo_description ?: str($app->about_us)->stripTags()->limit(140)->toString(),
                    'google_play_url' => $googlePlayUrl,
                    'app_store_url' => $app->app_store_url,
                    'logo_url' => $app->logo_url,
                    'primary_color' => $app->primary_color ?: '#6d5dfc',
                    'secondary_color' => $app->secondary_color ?: '#ffffff',
                ];
            });

        return view('showcase.apps', compact('apps'));
    }
}
