<?php

$tiers = [
    'tier-1' => [
        'US', 'CA', 'GB', 'IE', 'AU', 'NZ', 'CH', 'NO', 'SE', 'DK', 'FI',
        'NL', 'DE', 'AT', 'LU', 'LI', 'MC', 'AD', 'IS', 'SG', 'AE', 'QA',
        'KW', 'SA', 'HK',
    ],
    'tier-2' => [
        'FR', 'BE', 'IT', 'ES', 'PT', 'JP', 'KR', 'TW', 'IL', 'CY', 'MT',
        'SM', 'GI', 'BM', 'KY', 'VG', 'TC', 'SI', 'EE', 'LT', 'LV', 'CZ',
        'PL', 'SK', 'HU', 'GR', 'BH', 'OM', 'BN', 'MO', 'PR', 'GU', 'VI',
    ],
    'tier-3' => [
        'BR', 'MX', 'CL', 'AR', 'UY', 'CR', 'PA', 'CO', 'PE', 'EC', 'DO',
        'MY', 'TH', 'TR', 'ZA', 'RO', 'BG', 'HR', 'RS', 'ME', 'AL', 'BA',
        'MK', 'UA', 'MD', 'XK', 'KZ', 'GE', 'AM', 'AZ', 'AW', 'CW', 'SX',
        'GP', 'MQ', 'RE', 'GF', 'PF', 'NC', 'CN',
    ],
    'tier-4' => [
        'PK', 'IN', 'BD', 'LK', 'NP', 'ID', 'PH', 'VN', 'EG', 'MA', 'TN',
        'DZ', 'JO', 'LB', 'IQ', 'PS', 'LY', 'KE', 'NG', 'GH', 'TZ', 'UG',
        'ZM', 'ZW', 'NA', 'BW', 'SN', 'CI', 'CM', 'ET', 'RW', 'AO', 'MZ',
        'KH', 'MM', 'LA', 'MN', 'KG', 'UZ', 'TJ', 'BY', 'RU',
    ],
    'tier-5' => [
        'AF', 'YE', 'SY', 'SD', 'SO', 'SS', 'ER', 'BI', 'MW', 'SL', 'LR',
        'GN', 'GW', 'GM', 'ML', 'NE', 'TD', 'BF', 'BJ', 'TG', 'CG', 'CD',
        'CF', 'LS', 'SZ', 'MG', 'MR', 'KM', 'DJ', 'ST', 'CV', 'GQ', 'GA',
        'SC', 'MU', 'MV', 'BT', 'TL', 'PG', 'FJ', 'SB', 'VU', 'WS', 'TO',
        'KI', 'TV', 'NR', 'FM', 'MH', 'PW', 'HT', 'HN', 'NI', 'SV', 'GT',
        'BO', 'PY', 'VE', 'CU', 'JM', 'BZ', 'GY', 'SR', 'LC', 'VC', 'GD',
        'BB', 'TT', 'BS', 'AG', 'DM', 'KN', 'AI', 'AS', 'CK', 'MP', 'MS',
        'NU', 'NF', 'TK', 'WF', 'YT', 'IR', 'KP',
    ],
];

$countryToTier = [];

foreach ($tiers as $tierId => $countries) {
    foreach ($countries as $countryCode) {
        $countryToTier[$countryCode] = $tierId;
    }
}

return [
    'tiers' => $tiers,
    'country_to_tier' => $countryToTier,
];
