<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AffiliateConversion extends Model
{
    protected $fillable = [
        'affiliate_id', 'customer_email', 'order_amount', 'commission_amount', 'status',
    ];

    protected $casts = [
        'order_amount'      => 'decimal:2',
        'commission_amount' => 'decimal:2',
    ];

    public function affiliate() { return $this->belongsTo(Affiliate::class); }
}
