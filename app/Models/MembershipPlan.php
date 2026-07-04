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
        'free_trial_days',
        'tagline',
        'yearly_benefit',
        'sorting',
        'is_active',
    ];

    protected $casts = [
        'monthly_price' => 'decimal:2',
        'yearly_price' => 'decimal:2',
        'free_trial_days' => 'integer',
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
