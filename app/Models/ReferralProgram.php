<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralProgram extends Model
{
    protected $fillable = [
        'domain_id', 'name', 'code', 'description',
        'reward_type', 'reward_value', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean', 'reward_value' => 'decimal:2'];

    public function domain() { return $this->belongsTo(Domain::class); }
    public function uses()   { return $this->hasMany(ReferralUse::class); }
}
