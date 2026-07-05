<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MarketingExpense extends Model
{
    protected $fillable = [
        'domain_id',
        'campaign_id',
        'category',
        'amount',
        'currency',
        'description',
        'date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'date' => 'date',
    ];

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }

    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }
}
