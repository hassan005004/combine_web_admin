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
            background: #f6f7fb;
            color: #111827;
        }
        .shell { max-width: 1180px; margin: 0 auto; padding: 40px 20px 56px; }
        .header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
        .eyebrow { color: #6d5dfc; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: .08em; }
        h1 { margin: 8px 0 0; font-size: clamp(34px, 5vw, 58px); line-height: 1; letter-spacing: -.03em; }
        .subcopy { color: #5f6677; max-width: 620px; font-size: 16px; line-height: 1.65; margin: 16px 0 0; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 18px; }
        .card {
            display: flex;
            flex-direction: column;
            min-height: 280px;
            background: #fff;
            border: 1px solid #e7e9f0;
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(17, 24, 39, .06);
        }
        .icon {
            width: 64px;
            height: 64px;
            display: grid;
            place-items: center;
            border-radius: 16px;
            color: #fff;
            font-weight: 800;
            font-size: 24px;
            margin-bottom: 18px;
        }
        .title { font-size: 20px; font-weight: 800; margin: 0; }
        .package { margin-top: 6px; color: #7a8190; font-size: 13px; word-break: break-word; }
        .description { color: #4b5563; line-height: 1.55; font-size: 14px; margin: 16px 0 22px; flex: 1; }
        .actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 42px;
            border-radius: 999px;
            padding: 0 16px;
            text-decoration: none;
            font-size: 14px;
            font-weight: 700;
        }
        .button-primary { background: #111827; color: #fff; }
        .button-secondary { background: #eef0f6; color: #111827; }
        .empty {
            background: #fff;
            border: 1px dashed #cbd1df;
            border-radius: 18px;
            padding: 32px;
            color: #5f6677;
        }
        @media (max-width: 720px) {
            .header { display: block; }
            .shell { padding-top: 28px; }
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
                            {{ str($app['title'])->substr(0, 1)->upper() }}
                        </div>
                        <h2 class="title">{{ $app['title'] }}</h2>
                        <div class="package">{{ $app['application_id'] }}</div>
                        <p class="description">{{ $app['description'] ?: 'Install the latest version from the official store.' }}</p>
                        <div class="actions">
                            <a class="button button-primary" href="{{ $app['google_play_url'] }}" target="_blank" rel="noopener">Google Play</a>
                            @if($app['app_store_url'])
                                <a class="button button-secondary" href="{{ $app['app_store_url'] }}" target="_blank" rel="noopener">App Store</a>
                            @endif
                        </div>
                    </article>
                @endforeach
            </section>
        @endif
    </main>
</body>
</html>
