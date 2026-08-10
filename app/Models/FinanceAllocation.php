<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinanceAllocation extends Model
{
    protected $fillable = [
        'domain_id',
        'user_id',
        'allocation_type',
        'source_id',
        'mode',
        'percentage',
        'amount',
        'notes',
    ];

    protected $casts = [
        'percentage' => 'decimal:2',
        'amount' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
