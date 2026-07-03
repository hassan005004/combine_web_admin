<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Apps Showcase</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f4f6f8;
            color: #172033;
        }
        .shell {
            width: min(100%, 560px);
            margin: 0 auto;
            padding: 14px 10px 28px;
        }
        .header {
            position: sticky;
            top: 0;
            z-index: 5;
            margin: 0 -10px 8px;
            padding: 12px 14px 10px;
            background: rgba(244, 246, 248, .94);
            border-bottom: 1px solid #e4e8ef;
            backdrop-filter: blur(10px);
        }
        .eyebrow {
            color: #64748b;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: .08em;
            text-transform: uppercase;
        }
        h1 {
            margin: 3px 0 0;
            font-size: 22px;
            line-height: 1.15;
            letter-spacing: 0;
        }
        .subcopy {
            margin: 4px 0 0;
            color: #64748b;
            font-size: 12px;
            line-height: 1.4;
        }
        .grid {
            display: flex;
            flex-direction: column;
            overflow: hidden;
            background: #fff;
            border: 1px solid #e5e9f0;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(15, 23, 42, .06);
        }
        .card {
            display: grid;
            grid-template-columns: 52px minmax(0, 1fr) auto;
            align-items: center;
            gap: 10px;
            min-height: 76px;
            padding: 10px 10px;
            border-bottom: 1px solid #eef1f5;
            background: #fff;
        }
        .card:last-child {
            border-bottom: 0;
        }
        .icon {
            width: 48px;
            height: 48px;
            display: grid;
            place-items: center;
            border-radius: 12px;
            overflow: hidden;
            color: #fff;
            font-weight: 800;
            font-size: 19px;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,.28), 0 2px 6px rgba(15, 23, 42, .12);
        }
        .icon img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .content {
            min-width: 0;
            padding-right: 4px;
        }
        .title {
            margin: 0;
            overflow: hidden;
            color: #162033;
            font-size: 13px;
            font-weight: 800;
            line-height: 1.22;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .package {
            margin-top: 2px;
            overflow: hidden;
            color: #7a8494;
            font-size: 11px;
            line-height: 1.2;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .description {
            display: -webkit-box;
            -webkit-box-orient: vertical;
            -webkit-line-clamp: 2;
            overflow: hidden;
            margin: 3px 0 0;
            color: #667085;
            font-size: 10.5px;
            line-height: 1.25;
        }
        .actions {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            min-width: 54px;
        }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 48px;
            min-height: 25px;
            border-radius: 999px;
            padding: 0 10px;
            text-decoration: none;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .02em;
        }
        .button-primary { background: #e9f3ff; color: #1684e8; }
        .button-secondary {
            min-height: auto;
            padding: 0;
            background: transparent;
            color: #8a94a6;
            font-size: 9.5px;
            font-weight: 700;
        }
        .empty {
            background: #fff;
            border: 1px dashed #cbd1df;
            border-radius: 12px;
            padding: 24px;
            color: #5f6677;
            text-align: center;
        }
        @media (min-width: 721px) {
            .shell { padding-top: 24px; }
            .header {
                position: static;
                margin: 0 0 12px;
                border: 0;
                background: transparent;
                backdrop-filter: none;
            }
            h1 { font-size: 28px; }
            .subcopy { font-size: 14px; }
            .card {
                grid-template-columns: 62px minmax(0, 1fr) auto;
                min-height: 90px;
                gap: 14px;
                padding: 14px;
            }
            .icon {
                width: 58px;
                height: 58px;
                border-radius: 14px;
                font-size: 22px;
            }
            .title { font-size: 15px; }
            .package { font-size: 12px; }
            .description { font-size: 12px; }
            .button {
                min-width: 58px;
                min-height: 30px;
                font-size: 11px;
            }
        }
    </style>
</head>
<body>
    <main class="shell">
        <header class="header">
            <div>
                <div class="eyebrow">App Showcase</div>
                <h1>Explore Our Apps</h1>
                <p class="subcopy">Install apps directly from Google Play or the App Store.</p>
            </div>
        </header>

        @if($apps->isEmpty())
            <div class="empty">No apps are available yet.</div>
        @else
            <section class="grid" aria-label="Apps">
                @foreach($apps as $app)
                    <article class="card">
                        <div class="icon" style="background: {{ $app['primary_color'] }}">
                            @if($app['logo_url'])
                                <img src="{{ $app['logo_url'] }}" alt="{{ $app['title'] }} logo">
                            @else
                                {{ str($app['title'])->substr(0, 1)->upper() }}
                            @endif
                        </div>
                        <div class="content">
                            <h2 class="title">{{ $app['title'] }}</h2>
                            <div class="package">{{ $app['application_id'] }}</div>
                            <p class="description">{{ $app['description'] ?: 'Install the latest version from the official store.' }}</p>
                        </div>
                        <div class="actions">
                            <a class="button button-primary" href="{{ $app['google_play_url'] }}" target="_blank" rel="noopener">GET</a>
                            @if($app['app_store_url'])
                                <a class="button button-secondary" href="{{ $app['app_store_url'] }}" target="_blank" rel="noopener">iOS</a>
                            @endif
                        </div>
                    </article>
                @endforeach
            </section>
        @endif
    </main>
</body>
</html>
