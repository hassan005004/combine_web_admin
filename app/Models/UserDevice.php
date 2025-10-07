<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserDevice extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'device_id',
        'fcm_token',
    ];

    // Relationships
    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
