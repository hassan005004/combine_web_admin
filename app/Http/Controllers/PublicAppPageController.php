<?php

namespace App\Http\Controllers;

use App\Models\Domain;

class PublicAppPageController extends Controller
{
    private const PAGES = [
        'about-us' => [
            'column' => 'about_us',
            'title' => 'About Us',
        ],
        'privacy-policy' => [
            'column' => 'privacy_policy',
            'title' => 'Privacy Policy',
        ],
        'terms-and-conditions' => [
            'column' => 'terms_conditions',
            'title' => 'Terms and Conditions',
        ],
        'support-policy' => [
            'column' => 'support_policy',
            'title' => 'Support Policy',
        ],
    ];

    public function show(string $applicationId, string $page)
    {
        abort_unless(isset(self::PAGES[$page]), 404);

        $domain = Domain::where('application_id', $applicationId)->firstOrFail();
        $definition = self::PAGES[$page];
        $content = $domain->{$definition['column']};

        abort_if(blank($content), 404);

        return view('public-app-page', [
            'app' => $domain,
            'title' => $definition['title'],
            'content' => $content,
        ]);
    }

    public static function pageUrls(Domain $domain): array
    {
        $urls = [];
        foreach (self::PAGES as $slug => $definition) {
            if (blank($domain->{$definition['column']})) {
                continue;
            }

            $urls[$definition['column']] = route('app-pages.show', [
                'applicationId' => $domain->application_id,
                'page' => $slug,
            ]);
        }

        return $urls;
    }
}
