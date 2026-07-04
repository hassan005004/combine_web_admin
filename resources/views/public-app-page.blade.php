<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }} - {{ $app->title }}</title>
    <style>
        :root {
            color-scheme: light dark;
            --bg: #ffffff;
            --fg: #1f2937;
            --muted: #6b7280;
            --accent: {{ $app->primary_color ?: '#7c4dff' }};
            --border: rgba(107, 114, 128, 0.22);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #111827;
                --fg: #f3f4f6;
                --muted: #9ca3af;
                --border: rgba(156, 163, 175, 0.22);
            }
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            background: var(--bg);
            color: var(--fg);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            line-height: 1.6;
        }

        main {
            width: min(860px, 100%);
            margin: 0 auto;
            padding: 28px 20px 48px;
        }

        header {
            padding-bottom: 18px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--border);
        }

        .app-name {
            color: var(--muted);
            font-size: 13px;
            font-weight: 700;
            letter-spacing: .04em;
            text-transform: uppercase;
        }

        h1 {
            margin: 6px 0 0;
            font-size: clamp(26px, 6vw, 38px);
            line-height: 1.15;
        }

        a {
            color: var(--accent);
        }

        img, video, iframe {
            max-width: 100%;
        }

        table {
            width: 100%;
            border-collapse: collapse;
        }

        th, td {
            border: 1px solid var(--border);
            padding: 8px;
            text-align: left;
        }
    </style>
</head>
<body>
    <main>
        <header>
            <div class="app-name">{{ $app->title }}</div>
            <h1>{{ $title }}</h1>
        </header>
        <article>
            {!! $content !!}
        </article>
    </main>
</body>
</html>
