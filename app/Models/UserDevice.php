<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'email',
        'device_id',
        'fcm_token',
        'last_seen_at',
    ];

    protected $casts = [
        'last_seen_at' => 'datetime',
    ];

    // Relationships
    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
