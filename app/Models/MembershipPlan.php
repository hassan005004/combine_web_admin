<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'name',
        'monthly_price',
        'yearly_price',
        'currency',
        'free_trial_days',
        'yearly_free_months',
        'tagline',
        'yearly_benefit',
        'google_play_monthly_product_id',
        'google_play_monthly_base_plan_id',
        'google_play_monthly_offer_id',
        'google_play_yearly_product_id',
        'google_play_yearly_base_plan_id',
        'google_play_yearly_offer_id',
        'country_prices',
        'google_play_tier_product_ids',
        'sorting',
        'is_active',
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'free_trial_days' => 'integer',
        'yearly_free_months' => 'integer',
        'country_prices' => 'array',
        'google_play_tier_product_ids' => 'array',
        'is_active' => 'boolean',
    ];

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }

    public function features()
    {
        return $this->hasMany(MembershipFeature::class)->orderBy('sorting');
    }

    public static function normalizeCountryCode(?string $countryCode): ?string
    {
        $code = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', (string) $countryCode), 0, 2));

        return strlen($code) === 2 ? $code : null;
    }

    public static function normalizeCurrencyCode(?string $currency, ?string $fallback = 'USD'): ?string
    {
        $code = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', (string) $currency), 0, 3));

        if (strlen($code) === 3) {
            return $code;
        }

        return $fallback === null ? null : self::normalizeCurrencyCode($fallback, null);
    }

    public static function normalizeTierId(?string $tierId): ?string
    {
        $text = strtolower(trim((string) $tierId));

        if (preg_match('/tier[^0-9]*([1-5])/', $text, $matches)) {
            return 'tier-'.$matches[1];
        }

        return null;
    }

    public static function pricingTierForCountry(?string $countryCode): ?string
    {
        $countryCode = self::normalizeCountryCode($countryCode);

        if (! $countryCode) {
            return null;
        }

        return config("country_pricing_tiers.country_to_tier.{$countryCode}");
    }

    public static function normalizeTierProductIds(mixed $tierProductIds): array
    {
        if (! is_array($tierProductIds)) {
            return [];
        }

        $normalized = [];

        foreach ($tierProductIds as $tierId => $ids) {
            $tierId = self::normalizeTierId((string) $tierId);

            if (! $tierId) {
                continue;
            }

            $values = is_array($ids) ? $ids : ['monthly_product_id' => $ids];
            $monthlyProductId = trim((string) ($values['monthly_product_id'] ?? $values['product_id'] ?? ''));
            $monthlyBasePlanId = trim((string) ($values['monthly_base_plan_id'] ?? $values['base_plan_id'] ?? ''));
            $monthlyOfferId = trim((string) ($values['monthly_offer_id'] ?? $values['offer_id'] ?? ''));
            $yearlyProductId = trim((string) ($values['yearly_product_id'] ?? ''));
            $yearlyBasePlanId = trim((string) ($values['yearly_base_plan_id'] ?? ''));
            $yearlyOfferId = trim((string) ($values['yearly_offer_id'] ?? ''));
            $monthlyPrice = $values['monthly_price'] ?? null;
            $currency = self::normalizeCurrencyCode($values['currency'] ?? null, null);
            $row = [];

            if ($monthlyProductId !== '') {
                $row['monthly_product_id'] = $monthlyProductId;
            }

            if ($monthlyBasePlanId !== '') {
                $row['monthly_base_plan_id'] = $monthlyBasePlanId;
            }

            if ($monthlyOfferId !== '') {
                $row['monthly_offer_id'] = $monthlyOfferId;
            }

            if ($yearlyProductId !== '') {
                $row['yearly_product_id'] = $yearlyProductId;
            }

            if ($yearlyBasePlanId !== '') {
                $row['yearly_base_plan_id'] = $yearlyBasePlanId;
            }

            if ($yearlyOfferId !== '') {
                $row['yearly_offer_id'] = $yearlyOfferId;
            }

            if ($monthlyPrice !== null && $monthlyPrice !== '' && is_numeric($monthlyPrice)) {
                $row['monthly_price'] = round(max(0, (float) $monthlyPrice), 2);
            }

            if ($currency !== null) {
                $row['currency'] = $currency;
            }

            if ($row === []) {
                continue;
            }

            $normalized[$tierId] = $row;
        }

        return $normalized;
    }

    public function calculatedYearlyPrice(?float $monthlyPrice = null): float
    {
        $monthlyPrice ??= (float) $this->monthly_price;
        $freeMonths = min(12, max(0, (int) ($this->yearly_free_months ?? 0)));

        return round($monthlyPrice * max(0, 12 - $freeMonths), 2);
    }

    public function resolvedPricing(?string $countryCode = null): array
    {
        $defaultMonthlyPrice = (float) $this->monthly_price;
        $defaultYearlyPrice = (float) ($this->yearly_price ?: $this->calculatedYearlyPrice($defaultMonthlyPrice));
        $defaultCurrency = self::normalizeCurrencyCode($this->currency, 'USD') ?: 'USD';
        $countryCode = self::normalizeCountryCode($countryCode);
        $selectedCountryTier = self::pricingTierForCountry($countryCode);
        $tierConfig = $selectedCountryTier
            ? ($this->normalizedGooglePlayTierProductIds()[$selectedCountryTier] ?? null)
            : null;
        $monthlyPrice = $defaultMonthlyPrice;
        $yearlyPrice = $defaultYearlyPrice;
        $currency = $defaultCurrency;
        $countryPriceApplied = false;
        $tierPriceApplied = false;
        $countryPrices = is_array($this->country_prices) ? $this->country_prices : [];
        $countryPrice = $countryCode ? ($countryPrices[$countryCode] ?? null) : null;
        $tierProductIds = $this->normalizedGooglePlayTierProductIds();

        if (is_array($tierConfig) && array_key_exists('monthly_price', $tierConfig)) {
            $tierPriceApplied = true;
            $monthlyPrice = (float) $tierConfig['monthly_price'];
            $yearlyPrice = $this->calculatedYearlyPrice($monthlyPrice);
            $currency = self::normalizeCurrencyCode($tierConfig['currency'] ?? null, $defaultCurrency) ?: $defaultCurrency;
        }

        if (is_array($countryPrice)) {
            $countryPriceApplied = true;
            $monthlyPrice = array_key_exists('monthly_price', $countryPrice)
                ? (float) $countryPrice['monthly_price']
                : $monthlyPrice;
            $yearlyPrice = array_key_exists('yearly_price', $countryPrice)
                ? (float) $countryPrice['yearly_price']
                : $this->calculatedYearlyPrice($monthlyPrice);
            $currency = self::normalizeCurrencyCode($countryPrice['currency'] ?? null, $currency) ?: $currency;
        }

        if (! $countryPriceApplied && ! $tierPriceApplied) {
            $monthlyPrice = 0;
            $yearlyPrice = 0;
        }

        return [
            'country_code' => $countryCode,
            'country_tier' => $selectedCountryTier,
            'country_price_applied' => $countryPriceApplied,
            'tier_price_applied' => $tierPriceApplied && ! $countryPriceApplied,
            'monthly_price' => round($monthlyPrice, 2),
            'yearly_price' => round($yearlyPrice, 2),
            'currency' => $currency,
            'default_monthly_price' => round($defaultMonthlyPrice, 2),
            'default_yearly_price' => round($defaultYearlyPrice, 2),
            'default_currency' => $defaultCurrency,
        ];
    }

    public function normalizedGooglePlayTierProductIds(): array
    {
        return self::normalizeTierProductIds($this->google_play_tier_product_ids ?? []);
    }

    public function resolvedGooglePlay(?string $countryCode = null): array
    {
        $selectedCountryTier = self::pricingTierForCountry($countryCode);
        $tierProductIds = $this->normalizedGooglePlayTierProductIds();
        $selectedTierConfig = $selectedCountryTier ? ($tierProductIds[$selectedCountryTier] ?? []) : [];
        $tierMonthlyProductId = $this->filledString($selectedTierConfig['monthly_product_id'] ?? null);
        $tierMonthlyBasePlanId = $this->filledString($selectedTierConfig['monthly_base_plan_id'] ?? null);
        $tierMonthlyOfferId = $this->filledString($selectedTierConfig['monthly_offer_id'] ?? null);
        $tierYearlyProductId = $this->filledString($selectedTierConfig['yearly_product_id'] ?? null);
        $tierYearlyBasePlanId = $this->filledString($selectedTierConfig['yearly_base_plan_id'] ?? null);
        $tierYearlyOfferId = $this->filledString($selectedTierConfig['yearly_offer_id'] ?? null);
        $defaultMonthlyProductId = $this->filledString($this->google_play_monthly_product_id);
        $defaultYearlyProductId = $this->filledString($this->google_play_yearly_product_id);

        $monthlyProductId = $tierMonthlyProductId;
        $monthlyBasePlanId = $tierMonthlyProductId ? $tierMonthlyBasePlanId : null;
        $monthlyOfferId = $tierMonthlyProductId ? $tierMonthlyOfferId : null;
        $monthlyResolvedSource = $tierMonthlyProductId ? 'tier' : null;

        $yearlyProductId = $tierYearlyProductId;
        $yearlyBasePlanId = $tierYearlyProductId ? $tierYearlyBasePlanId : null;
        $yearlyOfferId = $tierYearlyProductId ? $tierYearlyOfferId : null;
        $yearlyResolvedSource = $tierYearlyProductId ? 'tier' : null;

        return [
            'monthly_product_id' => $monthlyProductId,
            'monthly_base_plan_id' => $monthlyBasePlanId,
            'monthly_offer_id' => $monthlyOfferId,
            'yearly_product_id' => $yearlyProductId,
            'yearly_base_plan_id' => $yearlyBasePlanId,
            'yearly_offer_id' => $yearlyOfferId,
            'default_monthly_product_id' => $this->google_play_monthly_product_id,
            'default_yearly_product_id' => $this->google_play_yearly_product_id,
            'tier_monthly_product_id' => $tierMonthlyProductId,
            'tier_monthly_base_plan_id' => $tierMonthlyBasePlanId,
            'tier_monthly_offer_id' => $tierMonthlyOfferId,
            'tier_yearly_product_id' => $tierYearlyProductId,
            'tier_yearly_base_plan_id' => $tierYearlyBasePlanId,
            'tier_yearly_offer_id' => $tierYearlyOfferId,
            'selected_country_tier' => $selectedCountryTier,
            'fallback_tier' => null,
            'resolved_source' => $monthlyResolvedSource ?: $yearlyResolvedSource,
            'monthly_resolved_source' => $monthlyResolvedSource,
            'yearly_resolved_source' => $yearlyResolvedSource,
            'tier_product_ids' => $tierProductIds,
            'tier_monthly_product_ids' => $tierProductIds,
        ];
    }

    public function hasGooglePlayProductId(?string $productId): bool
    {
        $productId = trim((string) $productId);

        if ($productId === '') {
            return false;
        }

        if ($productId === (string) $this->google_play_monthly_product_id
            || $productId === (string) $this->google_play_yearly_product_id) {
            return true;
        }

        foreach ($this->normalizedGooglePlayTierProductIds() as $tierIds) {
            if ($productId === (string) ($tierIds['monthly_product_id'] ?? '')
                || $productId === (string) ($tierIds['yearly_product_id'] ?? '')) {
                return true;
            }
        }

        return false;
    }

    public function periodForGooglePlayProductId(?string $productId, ?string $basePlanId = null): string
    {
        $productId = trim((string) $productId);
        $basePlanId = trim((string) $basePlanId);

        if ($basePlanId !== '') {
            if ($basePlanId === (string) $this->google_play_yearly_base_plan_id) {
                return 'yearly';
            }

            if ($basePlanId === (string) $this->google_play_monthly_base_plan_id) {
                return 'monthly';
            }

            foreach ($this->normalizedGooglePlayTierProductIds() as $tierIds) {
                if ($basePlanId === (string) ($tierIds['yearly_base_plan_id'] ?? '')) {
                    return 'yearly';
                }

                if ($basePlanId === (string) ($tierIds['monthly_base_plan_id'] ?? '')) {
                    return 'monthly';
                }
            }
        }

        $isYearly = $productId !== ''
            && ($productId === (string) $this->google_play_yearly_product_id
                || collect($this->normalizedGooglePlayTierProductIds())
                    ->contains(fn ($tierIds) => $productId === (string) ($tierIds['yearly_product_id'] ?? '')));

        return $isYearly ? 'yearly' : 'monthly';
    }

    private function filledString(mixed $value): ?string
    {
        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }
}
