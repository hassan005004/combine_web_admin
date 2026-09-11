<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AppMembership extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'email',
        'device_id',
        'plan',
        'promo_code',
        'promo_discount',
        'amount_paid',
        'provider',
        'status',
        'purchase_token_hash',
        'purchase_token',
        'order_id',
        'product_id',
        'base_plan_id',
        'offer_id',
        'country_code',
        'currency',
        'is_active',
        'expires_at',
        'grace_expires_at',
        'trial_started_at',
        'last_verified_at',
        'raw_purchase',
        'cancelled_at',
        'cancellation_requested_at',
        'cancellation_reason',
        'cancellation_details',
        'cancellation_source',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'expires_at'     => 'datetime',
        'grace_expires_at' => 'datetime',
        'trial_started_at' => 'datetime',
        'last_verified_at' => 'datetime',
        'cancelled_at'   => 'datetime',
        'cancellation_requested_at' => 'datetime',
        'promo_discount' => 'decimal:2',
        'amount_paid'    => 'decimal:2',
        'raw_purchase' => 'array',
    ];

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
