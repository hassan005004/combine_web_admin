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
        'plan',
        'promo_code',
        'promo_discount',
        'amount_paid',
        'is_active',
        'expires_at',
        'cancelled_at',
        'cancellation_requested_at',
        'cancellation_reason',
        'cancellation_details',
        'cancellation_source',
    ];

    protected $casts = [
        'is_active'      => 'boolean',
        'expires_at'     => 'datetime',
        'cancelled_at'   => 'datetime',
        'cancellation_requested_at' => 'datetime',
        'promo_discount' => 'decimal:2',
        'amount_paid'    => 'decimal:2',
    ];

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
