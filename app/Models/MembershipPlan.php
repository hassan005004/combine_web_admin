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
        'sorting',
        'is_active',
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'free_trial_days' => 'integer',
        'yearly_free_months' => 'integer',
        'country_prices' => 'array',
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
}
