<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'domain_id',
        'services_file',
        'token',
        'token_expiry',
    ];

    protected $casts = [
        'token_expiry' => 'datetime',
    ];

    // Relationships
    public function domain()
    {
        return $this->belongsTo(Domain::class);
    }
}
