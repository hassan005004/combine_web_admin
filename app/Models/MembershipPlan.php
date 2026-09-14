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

            $monthlyProductId = is_array($ids)
                ? trim((string) ($ids['monthly_product_id'] ?? $ids['product_id'] ?? ''))
                : trim((string) $ids);

            if ($monthlyProductId === '') {
                continue;
            }

            $normalized[$tierId] = [
                'monthly_product_id' => $monthlyProductId,
            ];
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
        $defaultCurrency = strtoupper((string) ($this->currency ?: 'USD'));
        $countryCode = self::normalizeCountryCode($countryCode);
        $monthlyPrice = $defaultMonthlyPrice;
        $yearlyPrice = $defaultYearlyPrice;
        $currency = $defaultCurrency;
        $countryPriceApplied = false;
        $countryPrices = is_array($this->country_prices) ? $this->country_prices : [];
        $countryPrice = $countryCode ? ($countryPrices[$countryCode] ?? null) : null;

        if (is_array($countryPrice)) {
            $countryPriceApplied = true;
            $monthlyPrice = array_key_exists('monthly_price', $countryPrice)
                ? (float) $countryPrice['monthly_price']
                : $defaultMonthlyPrice;
            $yearlyPrice = array_key_exists('yearly_price', $countryPrice)
                ? (float) $countryPrice['yearly_price']
                : $this->calculatedYearlyPrice($monthlyPrice);
            $currency = strtoupper((string) ($countryPrice['currency'] ?? $defaultCurrency));
        }

        return [
            'country_code' => $countryCode,
            'country_price_applied' => $countryPriceApplied,
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
        $tierMonthlyProductId = $selectedCountryTier
            ? ($tierProductIds[$selectedCountryTier]['monthly_product_id'] ?? null)
            : null;

        return [
            'monthly_product_id' => $tierMonthlyProductId ?: $this->google_play_monthly_product_id,
            'monthly_base_plan_id' => $this->google_play_monthly_base_plan_id,
            'monthly_offer_id' => $this->google_play_monthly_offer_id,
            'yearly_product_id' => $this->google_play_yearly_product_id,
            'yearly_base_plan_id' => $this->google_play_yearly_base_plan_id,
            'yearly_offer_id' => $this->google_play_yearly_offer_id,
            'default_monthly_product_id' => $this->google_play_monthly_product_id,
            'tier_monthly_product_id' => $tierMonthlyProductId,
            'selected_country_tier' => $selectedCountryTier,
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
            if ($productId === (string) ($tierIds['monthly_product_id'] ?? '')) {
                return true;
            }
        }

        return false;
    }

    public function periodForGooglePlayProductId(?string $productId): string
    {
        $isYearly = trim((string) $productId) !== ''
            && $productId === $this->google_play_yearly_product_id;

        return $isYearly ? 'yearly' : 'monthly';
    }
}
