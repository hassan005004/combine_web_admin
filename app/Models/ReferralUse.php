<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReferralUse extends Model
{
    protected $fillable = ['referral_program_id', 'referred_email', 'referrer_email', 'used_at'];
    protected $casts    = ['used_at' => 'datetime'];

    public function program() { return $this->belongsTo(ReferralProgram::class, 'referral_program_id'); }
}
