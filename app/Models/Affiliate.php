<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Affiliate extends Model
{
    protected $fillable = [
        'domain_id', 'name', 'email', 'code',
        'commission_rate', 'total_earned', 'total_paid', 'status',
    ];

    protected $casts = [
        'commission_rate' => 'decimal:2',
        'total_earned'    => 'decimal:2',
        'total_paid'      => 'decimal:2',
    ];

    public function domain()      { return $this->belongsTo(Domain::class); }
    public function conversions() { return $this->hasMany(AffiliateConversion::class); }
}
