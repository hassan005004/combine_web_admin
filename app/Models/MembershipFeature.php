<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipFeature extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'membership_plan_id',
        'icon',
        'text',
        'sorting',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }

    public function plan()
    {
        return $this->belongsTo(MembershipPlan::class, 'membership_plan_id');
    }
}
