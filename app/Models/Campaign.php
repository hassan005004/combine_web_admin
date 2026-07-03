<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    protected $fillable = [
        'domain_id', 'name', 'type', 'platform', 'objective', 'budget_amount',
        'spent_amount', 'earned_amount', 'status', 'subject',
        'body', 'scheduled_at', 'sent_at', 'sent_count', 'open_count', 'click_count',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at'      => 'datetime',
        'budget_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'earned_amount' => 'decimal:2',
    ];

    public function domain() { return $this->belongsTo(Domain::class); }
    public function expenses() { return $this->hasMany(MarketingExpense::class); }
}
